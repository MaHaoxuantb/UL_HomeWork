from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import boto3
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # 设定一个密钥
jwt = JWTManager(app)
CORS(app)

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

# 用户登录API
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    student_id = data.get('username', None)  # 使用 student_id 作为用户名
    key = data.get('password', None)  # 使用 key 作为密码

    # 根据 student_id 查询 DynamoDB
    try:
        response = students_table.get_item(Key={'student-id': student_id})
        student = response.get('Item')

        if student and student['key'] == key:
            access_token = create_access_token(identity=student_id)
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 查询学生信息
@app.route('/get_student_info', methods=['POST'])
@jwt_required()
def get_student_info():
    data = request.json
    student_id = data.get('student_id')

    try:
        response = students_table.get_item(Key={'student-id': student_id})
        if 'Item' in response:
            return jsonify(response['Item']), 200
        else:
            return jsonify({'message': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 查询学生作业信息
@app.route('/get_assignments', methods=['POST'])
@jwt_required()
def get_assignments():
    data = request.json
    student_id = data.get('student_id')

    try:
        # 根据 student_id 查询作业信息
        response = assignments_table.query(
        KeyConditionExpression="#student_id = :student_id",
        ExpressionAttributeNames={
            '#student_id': 'student-id'  # 使用 ExpressionAttributeNames 处理包含 "-" 的属性名
        },
        ExpressionAttributeValues={
            ':student_id': student_id
        }
        )
        if 'Items' in response:
            return jsonify(response['Items']), 200
        else:
            return jsonify({'message': 'No assignments found for this student.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加作业API
@app.route('/add_assignment', methods=['POST'])
@jwt_required()
def add_assignment():
    data = request.json
    class_id = data.get('class_id')
    assignment_title = data.get('assignment_title')
    assignment_content = data.get('assignment_content')
    due_date = data.get('due_date')

    # 创建唯一的作业 ID
    assignment_id = str(uuid.uuid4())
    
    # 记录作业信息
    try:
        response = assignments_table.put_item(
            Item={
                'class-id#assignment-id': f"{class_id}#{assignment_id}",
                'assignment-id': assignment_id,
                'class-id': class_id,
                'assignment-title': assignment_title,
                'assignment-content': assignment_content,
                'due-date': due_date,
                'completion-status': 'Incomplete'  # 默认设置为未完成
            }
        )
        return jsonify({'message': 'Assignment added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 标记作业为已完成或未完成的 API
@app.route('/complete_assignment', methods=['POST'])
@jwt_required()
def complete_assignment():
    data = request.json
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
        else:
            return jsonify({'message': 'Assignment not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
