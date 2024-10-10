from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import boto3
from boto3.dynamodb.conditions import Key

from datetime import datetime
from datetime import timedelta

import uuid
import json

from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from redis import Redis



# 设定 Flask应用
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = secrets.token_hex(128)  # 生成一个强随机的 128 字节密钥（1024 位）
jwt = JWTManager(app)
CORS(app)

# 创建 Redis 客户端
redis_client = Redis(host='localhost', port=6379, db=0)

# 使用 Flask-Limiter，基于 JWT 身份进行速率限制
limiter = Limiter(
    key_func=lambda: get_remote_address() if not request.endpoint.startswith('auth') else get_jwt_identity().get('student_id'),
    storage_uri="redis://localhost:6379",  # 指定 Redis 作为存储
    app=app,
    default_limits=["200 per day", "100 per hour"]  # 设置全局速率限制
)

# 为所有路由添加总体的请求限制
@app.before_request
@limiter.limit("3000 per day; 500 per hour")  # 全局限制：每天最多 3000 次请求，每小时最多 500 次请求
def limit_global():
    pass

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table('Students')  # 学生信息表
assignments_table = dynamodb.Table('AssignmentsCompletion')  # 作业完成情况表


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

# 添加作业页面
@app.route('/add-assignment', methods=['GET'])
def add_assignment_page():
    return render_template('add-assignment.html')

@app.route('/edit-assignment', methods=['GET'])
def edit_assignment_page():
    return render_template('edit-assignment.html')

@app.route('/change-password', methods=['GET'])
def change_password_page():
    return render_template('change-password.html')


# 添加学生API
@app.route('/add_student', methods=['POST'])
def add_student():
    data = request.json
    student_id = data.get('student_id')
    password = data.get('password')
    hashed_password = generate_password_hash(password)  # 存储密码的哈希值
    name = data.get('name')
    english_name = data.get('english_name')  # 获取学生的英文名
    role = data.get('role')  # 获取学生的角色
    email = data.get('email')
    class_ids = data.get('class_ids')
    age = data.get('age')
    gender = data.get('gender')
    phone_number = data.get('phone_number')
    enrollment_date = datetime.now().isoformat()  # 记录入学日期

    try:
        students_table.put_item(
            Item={
                'student-id': student_id,   # 主键：学生ID
                'key': hashed_password,  # 存储密码哈希值
                'name': name,               # 学生姓名
                'englishName': english_name,  # 学生英文名
                'role': role,               # 学生角色
                'email': email,             # 学生邮箱
                'class-ids': class_ids,     # 学生注册的班级列表
                'enrollment-date': enrollment_date,  # 入学日期
                'age': age,                 # 学生年龄
                'gender': gender,           # 学生性别
                'phone-number': phone_number  # 学生电话号码
            }
        )
        return jsonify({'message': 'Student added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 学生登录API
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    try:
        # 使用二级索引通过用户名查找学生信息
        response = students_table.query(
            IndexName='name-student-id-index',  # 使用你创建的二级索引
            KeyConditionExpression=boto3.dynamodb.conditions.Key('name').eq(username)
        )

        # 检查查询结果
        if response['Count'] == 0:
            return jsonify({'error': 'Student not found'}), 404

        student = response['Item']
        if check_password_hash(student['key'], password):
            # 在令牌中包含用户的角色信息
            role = student.get('role')
            access_token = create_access_token(identity={'student_id': student_id, 'role': role}, expires_delta=timedelta(days=7))
            # 在登录成功响应中添加 student_id
            return jsonify({'message': 'Login successful', 'access_token': access_token, 'student_id': student_id}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 查询学生信息
@app.route('/get_student_info', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def get_student_info():
    identity = get_jwt_identity()
    student_id = identity.get('student_id')

    data = request.json
    requested_student_id = data.get('student_id')

    try:
        response = students_table.get_item(Key={'student-id': student_id})
        if not student_id:
            return jsonify({'error': 'student_id is required'}), 422

        if 'Item' in response:
            return jsonify(response['Item']), 200
        else:
            return jsonify({'message': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 查询学生作业信息
# 查询某个班级的所有学生
def get_students_in_class(class_id):
    response = students_table.scan(
        FilterExpression="contains(#class_ids, :class_id)",
        ExpressionAttributeNames={
            '#class_ids': 'class-ids'  # 使用ExpressionAttributeNames替代带有连字符的属性名
        },
        ExpressionAttributeValues={
            ':class_id': class_id
        }
    )
    return response.get('Items', [])

# 为学生添加作业记录
def insert_assignment_completion(student_id, class_id, assignment_id, assignment_title, assignment_content, due_date, teacher_name, submission_method, subject, status='Incomplete'):
    class_assignment_id = f"{class_id}#{assignment_id}"  # 组合学科班级ID和作业ID
    submission_time = datetime.now().isoformat()         # 提交时间
    
    assignments_table.put_item(
        Item={
            'student-id': student_id,
            'class-id#assignment-id': class_assignment_id,
            'class-id': class_id,
            'assignment-id': assignment_id,
            'due-date': due_date,
            'assignment-title': assignment_title,
            'assignment-content': assignment_content,
            'teacher-name': teacher_name,
            'submission-method': submission_method,
            'subject': subject,
            'completion-status': status,
            'submission-time': submission_time
        }
    )

# 添加作业API
@app.route('/add_assignment', methods=['POST'])
@jwt_required()
def add_assignment():
    current_user = get_jwt_identity()
    
    # 验证用户角色，确保只有教师或管理员可以添加作业
    if current_user.get('role') not in ['assistant', 'teacher', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.json
    class_id = data.get('class_id')
    assignment_title = data.get('assignment_title')
    assignment_content = data.get('assignment_content')
    due_date = data.get('due_date')
    teacher_name = data.get('teacher_name')
    submission_method = data.get('submission_method')
    subject = data.get('subject')

    # 检查必填字段
    required_fields = ['class_id', 'assignment_title', 'assignment_content', 'due_date', 'teacher_name', 'submission_method', 'subject']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400
    
    # 生成一个共享的 assignment_id
    assignment_id = str(uuid.uuid4())

    # 查询班级里的所有学生
    students = get_students_in_class(class_id)
    
    if not students:
        return jsonify({'error': 'No students found in the specified class'}), 404
    
    # 为每个学生添加作业记录
    for student in students:
        student_id = student.get('student-id')
        if not student_id:
            continue  # 跳过没有 student-id 的记录
        insert_assignment_completion(
            student_id=student_id,
            class_id=class_id,
            assignment_id=assignment_id,  # 使用共享的 assignment_id
            assignment_title=assignment_title,
            assignment_content=assignment_content,
            due_date=due_date,
            teacher_name=teacher_name,
            submission_method=submission_method,
            subject=subject
        )
    
    return jsonify({'message': 'Assignment added to all students in the class successfully', 'assignment_id': assignment_id}), 200


# 分段查询未完成作业API
@app.route('/incomplete_assignments', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def get_incomplete_assignments():
    try:
        current_user = get_jwt_identity()
        student_id = str(current_user['student_id'])  # 确保 student_id 是字符串类型
        last_evaluated_key = request.args.get('last_evaluated_key', None)
        limit = int(request.args.get('limit', 15))

        # 使用 studentIdCompletionStatusIndex 进行查询
        query_kwargs = {
            'IndexName': 'studentIdCompletionStatusIndex',
            'KeyConditionExpression': '#studentId = :student_id AND #completion_status = :status',
            'ExpressionAttributeNames': {
                '#studentId': 'student-id',
                '#completion_status': 'completion-status'
            },
            'ExpressionAttributeValues': {
                ':student_id': student_id,
                ':status': 'Incomplete'
            },
            'Limit': limit
        }

        if last_evaluated_key:
            try:
                last_evaluated_key = json.loads(last_evaluated_key)
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid last_evaluated_key format'}), 400
            query_kwargs['ExclusiveStartKey'] = last_evaluated_key

        response = assignments_table.query(**query_kwargs)

        return jsonify({
            'items': response['Items'],
            'last_evaluated_key': response.get('LastEvaluatedKey')
        }), 200
    except Exception as e:
        app.logger.error(f"Error in /incomplete_assignments: {e}")
        return jsonify({'error': str(e)}), 500




#分段查询已完成作业 API
@app.route('/completed_assignments', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def get_completed_assignments():
    try:
        current_user = get_jwt_identity()
        student_id = str(current_user['student_id'])
        last_evaluated_key = request.args.get('last_evaluated_key', None)
        limit = int(request.args.get('limit', 15))

        # 使用 studentIdCompletionStatusIndex 进行查询
        query_kwargs = {
            'IndexName': 'studentIdCompletionStatusIndex',
            'KeyConditionExpression': '#studentId = :student_id AND #completion_status = :status',
            'ExpressionAttributeNames': {
                '#studentId': 'student-id',
                '#completion_status': 'completion-status'
            },
            'ExpressionAttributeValues': {
                ':student_id': student_id,
                ':status': 'Complete'
            },
            'Limit': limit
        }

        if last_evaluated_key:
            query_kwargs['ExclusiveStartKey'] = last_evaluated_key

        response = assignments_table.query(**query_kwargs)

        return jsonify({
            'items': response['Items'],
            'last_evaluated_key': response.get('LastEvaluatedKey')
        }), 200
    except Exception as e:
        app.logger.error(f"Error in /completed_assignments: {e}")
        return jsonify({'error': str(e)}), 500




# 分段查询所有作业API
@app.route('/all_assignments', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def get_all_assignments():
    try:
        current_user = get_jwt_identity()
        student_id = str(current_user['student_id'])
        last_evaluated_key = request.args.get('last_evaluated_key', None)
        limit = int(request.args.get('limit', 15))

        # 使用 DueDateIndex 进行查询
        query_kwargs = {
            'IndexName': 'DueDateIndex',
            'KeyConditionExpression': '#studentId = :student_id',
            'ExpressionAttributeNames': {
                '#studentId': 'student-id'
            },
            'ExpressionAttributeValues': {
                ':student_id': student_id
            },
            'Limit': limit
        }

        if last_evaluated_key:
            query_kwargs['ExclusiveStartKey'] = last_evaluated_key

        query_kwargs['ScanIndexForward'] = False  # 按截止日期从现在到过去排序
        response = assignments_table.query(**query_kwargs)

        return jsonify({
            'items': response['Items'],
            'last_evaluated_key': response.get('LastEvaluatedKey')
        }), 200
    except Exception as e:
        app.logger.error(f"Error in /all_assignments: {e}")
        return jsonify({'error': str(e)}), 500





# 标记作业为已完成或未完成的 API
@app.route('/complete_assignment', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def complete_assignment():
    print(request.json)
    data = request.json
    current_user = get_jwt_identity()
    student_id = data.get('student_id')
    class_id = data.get('class_id')
    assignment_id = data.get('assignment_id')
    status = data.get('status')  # 获取前端传递的状态
    submission_time = datetime.now().isoformat()

    try:
        # 更新作业的 completion-status 字段为传递的 status (Complete 或 Incomplete)
        response = assignments_table.update_item(
            Key={
                'student-id': student_id,
                'class-id#assignment-id': f'{class_id}#{assignment_id}'
            },
            UpdateExpression="SET #status = :status, #submission_time = :submission_time",
            ExpressionAttributeNames={
                '#status': 'completion-status',
                '#submission_time': 'submission-time'
            },
            ExpressionAttributeValues={
                ':status': status,  # 设置为传递的 status (Complete 或 Incomplete)
                ':submission_time': submission_time
            },
            ReturnValues="UPDATED_NEW"
        )

        if 'Attributes' in response:
            return jsonify({'message': f'Assignment marked as {status}', 'updated': response['Attributes']}), 200
            print("asdfasdfasdfasdfasdf")
            print(jsonify(response))
        else:
            return jsonify({'message': 'Assignment not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# 修改用户密码API
@app.route('/change_password', methods=['POST'])
@jwt_required()
@limiter.limit("1 per minute")  # 每个客户端（基于 JWT）每分钟最多请求
def change_password():
    current_user = get_jwt_identity()
    student_id = current_user['student_id']

    data = request.json
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    try:
        # 获取学生信息
        response = students_table.get_item(Key={'student-id': student_id})
        if 'Item' not in response:
            return jsonify({'error': 'Student not found'}), 404

        student = response['Item']

        # 验证旧密码
        if not check_password_hash(student['key'], old_password):
            return jsonify({'error': 'Invalid old password'}), 401

        # 更新密码
        hashed_new_password = generate_password_hash(new_password)
        students_table.update_item(
            Key={'student-id': student_id},
            UpdateExpression="SET #key = :new_key",
            ExpressionAttributeNames={
                '#key': 'key'
            },
            ExpressionAttributeValues={
                ':new_key': hashed_new_password
            }
        )

        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 删除某个班级的特定作业
@app.route('/delete_class_assignment', methods=['DELETE'])
@jwt_required()
@limiter.limit("5 per minute")
def delete_class_assignment():
    current_user = get_jwt_identity()

    # 权限检查，确保只有教师或管理员可以执行此操作
    if current_user.get('role') not in ['teacher', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.json
    class_id = data.get('class_id')
    assignment_id = data.get('assignment_id')

    if not class_id or not assignment_id:
        return jsonify({'error': 'Missing class ID or assignment ID'}), 400

    try:
        # 查询属于该班级的特定作业
        response = assignments_table.query(
            IndexName='ClassAssignmentIndex',  # 假设你创建了一个以 class-id 和 assignment-id 为索引的二级索引
            KeyConditionExpression=Key('class-id').eq(class_id) & Key('assignment-id').eq(assignment_id)
        )

        items = response.get('Items', [])
        if not items:
            return jsonify({'message': 'Assignment not found'}), 404

        # 删除该特定作业
        for item in items:
            assignments_table.delete_item(
                Key={
                    'student-id': item['student-id'],
                    'class-id#assignment-id': item['class-id#assignment-id']
                }
            )

        return jsonify({'message': 'Assignment deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)
