import boto3
from datetime import datetime

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')

# 引用表
assignments_table = dynamodb.Table('AssignmentsCompletion')

# 更新作业状态为 "Complete"
def mark_assignment_as_complete(student_id, class_id, assignment_id):
    submission_time = datetime.now().isoformat()  # 获取当前时间作为提交时间

    # 更新作业的完成状态
    response = assignments_table.update_item(
        Key={
            'student-id': student_id,                         # 分区键：学生ID
            'class-id#assignment-id': f'{class_id}#{assignment_id}'  # 排序键：班级ID和作业ID的组合
        },
        UpdateExpression="SET #status = :status, #submission_time = :submission_time",
        ExpressionAttributeNames={
            '#status': 'completion-status',            # 更新作业状态
            '#submission_time': 'submission-time'      # 更新提交时间
        },
        ExpressionAttributeValues={
            ':status': 'Complete',                     # 标记作业为已完成
            ':submission_time': submission_time        # 记录提交时间
        },
        ReturnValues="UPDATED_NEW"  # 返回更新后的新值
    )

    if 'Attributes' in response:
        print(f"Assignment for student {student_id} in class {class_id} marked as complete.")
        print(f"Updated attributes: {response['Attributes']}")
    else:
        print(f"No item found for student {student_id} with assignment {assignment_id} in class {class_id}")

# 示例使用
def example_mark_assignment_complete():
    student_id = '2027PR4494'  # 替换为学生ID
    class_id = 'Math101'       # 替换为班级ID
    assignment_id = '1e27d295-2924-4435-a50c-9560ad5a3152'  # 替换为作业ID

    # 标记作业为已完成
    mark_assignment_as_complete(student_id, class_id, assignment_id)

# 执行示例
example_mark_assignment_complete()
