import boto3
from boto3.dynamodb.conditions import Key

# 配置 DynamoDB
session = boto3.Session()
dynamodb = session.resource('dynamodb')
assignments_table = dynamodb.Table('AssignmentsCompletion')

def delete_class_assignment(class_id, assignment_id):
    if not class_id or not assignment_id:
        print("Class ID and Assignment ID cannot be empty")
        return

    try:
        # 查询属于该班级的特定作业
        response = assignments_table.query(
            IndexName='ClassAssignmentIndex',  # 确保你创建了一个以 class-id 和 assignment-id 为索引的二级索引
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

        print('Assignment deleted successfully')
    except Exception as e:
        print(f'Error: {str(e)}')

if __name__ == "__main__":
    class_id = input("Enter class ID: ")
    assignment_id = input("Enter assignment ID: ")
    delete_class_assignment(class_id, assignment_id)

"""
# 示例使用
def example_delete_assignment():
    class_id = input("PreFE/Ec8")  # 替换为你想删除作业的班级ID
    assignment_id = input("1a50453a-e24c-4b6b-9fb1-ea5fa67d1cb5")  # 替换为你想删除的作业ID
    delete_class_assignment(class_id, assignment_id)
"""
