import boto3

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')

# 引用作业完成情况表
assignments_table = dynamodb.Table('AssignmentsCompletion')

# 查询特定学生的所有作业
def query_student_assignments(student_id):
    # 查询AssignmentsCompletion表中与该学生相关的所有作业
    response = assignments_table.query(
        KeyConditionExpression="#student_id = :student_id",
        ExpressionAttributeNames={
            '#student_id': 'student-id'  # 使用 ExpressionAttributeNames 处理包含 "-" 的属性名
        },
        ExpressionAttributeValues={
            ':student_id': student_id
        }
    )

    # 检查是否有作业
    if 'Items' in response and len(response['Items']) > 0:
        print(f"Assignments for student {student_id}:")
        for assignment in response['Items']:
            print(assignment)  # 打印每一条作业记录的详细信息
        return response['Items']  # 返回查询到的所有作业信息
    else:
        print(f"No assignments found for student {student_id}")
        return []

# 示例使用
def example_query_assignments():
    student_id = '2027PR4494'  # 替换为你想查询的学生ID
    assignments = query_student_assignments(student_id)
    
    # 安全获取字段值，避免KeyError
    for assignment in assignments:
        class_id = assignment.get('class-id', 'N/A')  # 使用get方法获取class-id，若不存在则返回"N/A"
        assignment_title = assignment.get('assignment-title', 'N/A')  # 若 assignment-title 不存在则返回"N/A"
        status = assignment.get('completion-status', 'N/A')  # 若 completion-status 不存在则返回"N/A"
        due_date = assignment.get('due-date', 'N/A')  # 若 due-date 不存在则返回"N/A"
        
        print(f"Class: {class_id}, Assignment Title: {assignment_title}, Status: {status}, Due Date: {due_date}")

# 执行查询示例
example_query_assignments()