from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import boto3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 启用 CORS 支持

# 初始化 DynamoDB 客户端
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table('Students')
assignments_table = dynamodb.Table('AssignmentsCompletion')

# 渲染 index.html 页面
@app.route('/')
def index():
    return render_template('index.html')

# 添加学生 API
@app.route('/add_student', methods=['POST'])
def add_student():
    try:
        data = request.json
        student_id = data.get('student_id')
        name = data.get('name')
        email = data.get('email')
        class_ids = data.get('class_ids')
        age = data.get('age')
        gender = data.get('gender')
        phone_number = data.get('phone_number')

        # 插入数据到 DynamoDB
        enrollment_date = datetime.now().isoformat()
        students_table.put_item(
            Item={
                'student-id': student_id,
                'name': name,
                'email': email,
                'class-ids': class_ids,
                'enrollment-date': enrollment_date,
                'age': age,
                'gender': gender,
                'phone-number': phone_number
            }
        )
        return jsonify({'message': f'Student {name} added successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 查询学生作业的 API
@app.route('/get_student_assignments', methods=['POST'])
def get_student_assignments():
    try:
        data = request.json
        student_id = data.get('student_id')

        # 查询 DynamoDB
        response = assignments_table.query(
            KeyConditionExpression="#student_id = :student_id",
            ExpressionAttributeNames={
                '#student_id': 'student-id'
            },
            ExpressionAttributeValues={
                ':student_id': student_id
            }
        )
        assignments = response['Items']
        if assignments:
            return jsonify(assignments), 200
        else:
            return jsonify({'message': 'No assignments found for this student.'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 启动 Flask 服务器
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
