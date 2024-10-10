# Code is wrong for the assignment id used
"""
import boto3
import uuid
from datetime import datetime

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')

# 引用表
students_table = dynamodb.Table('Students')  # 学生信息表
assignments_table = dynamodb.Table('AssignmentsCompletion')  # 作业完成情况表

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
    return response['Items']

# 为学生添加作业记录
def insert_assignment_completion(student_id, class_id, assignment_title, assignment_content, due_date, teacher_name, submission_method, subject, status='Incomplete'):
    assignment_id = str(uuid.uuid4())  # 生成唯一的作业ID
    class_assignment_id = f"{class_id}#{assignment_id}"  # 组合学科班级ID和作业ID
    submission_time = datetime.now().isoformat()  # 提交时间
    
    response = assignments_table.put_item(
        Item={
            'student-id': student_id,                     # 分区键：学生ID
            'class-id#assignment-id': class_assignment_id,  # 排序键：班级ID和作业ID
            'class-id': class_id,                         # 班级ID
            'assignment-id': assignment_id,               # 作业ID
            'due-date': due_date,                         # 作业截止日期
            'assignment-title': assignment_title,         # 作业标题
            'assignment-content': assignment_content,     # 作业详情
            'teacher-name': teacher_name,                 # 教师姓名
            'submission-method': submission_method,       # 提交方式
            'subject': subject,                           # 学科
            'completion-status': status,                  # 作业状态
            'submission-time': submission_time            # 作业提交时间
        }
    )
    print(f"Assignment added for student {student_id} in class {class_id}")

# 为特定班级的所有学生添加作业
def add_assignment_to_class(class_id, assignment_title, assignment_content, due_date, teacher_name, submission_method, subject):
    # 获取班级所有学生
    students = get_students_in_class(class_id)
    
    # 为每个学生添加作业记录
    for student in students:
        student_id = student['student-id']
        insert_assignment_completion(student_id, class_id, assignment_title, assignment_content, due_date, teacher_name, submission_method, subject)
    
    print(f"Assignment '{assignment_title}' added to all students in class {class_id}.")

# 示例使用
def example_add_assignment():
    class_id = 'PreFA/Mt8'  # 替换为目标班级的ID
    assignment_title = 'Math HW'  # 作业标题
    assignment_content = 'Test math assignment'  # 作业详情
    due_date = '2024-10-30'  # 作业截止日期
    teacher_name = 'sdkfasdf'  # 教师姓名
    submission_method = 'F'  # 提交方式
    subject = 'math'  # 学科

    # 为该班级的所有学生添加作业
    add_assignment_to_class(class_id, assignment_title, assignment_content, due_date, teacher_name, submission_method, subject)

# 执行示例
example_add_assignment()
"""