import boto3
from boto3.dynamodb.conditions import Key

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')

# 引用作业完成情况表
assignments_table = dynamodb.Table('AssignmentsCompletion')

# 删除特定班级的特定作业
def delete_class_assignment(class_id, assignment_id):
    try:
        # 查询属于该班级的特定作业
        response = assignments_table.query(
            IndexName='ClassAssignmentIndex',  # 假设你创建了一个以 class-id 和 assignment-id 为索引的二级索引
            KeyConditionExpression=Key('class-id').eq(class_id) & Key('assignment-id').eq(assignment_id)
        )

        items = response.get('Items', [])
        if not items:
            print('Assignment not found')
            return

        # 删除该特定作业
        for item in items:
            assignments_table.delete_item(
                Key={
                    'student-id': item['student-id'],
                    'class-id#assignment-id': item['class-id#assignment-id']
                }
            )

        print(f"Assignment for class {class_id} and assignment ID {assignment_id} deleted successfully")

    except Exception as e:
        print(f'Error: {str(e)}')

# 示例使用
def example_delete_assignment():
    class_id = input("Enter class ID: ")  # 替换为你想删除作业的班级ID
    assignment_id = input("Enter assignment ID: ")  # 替换为你想删除的作业ID
    delete_class_assignment(class_id, assignment_id)

# 执行删除示例
example_delete_assignment()
