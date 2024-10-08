import boto3

# 初始化DynamoDB客户端
dynamodb = boto3.resource('dynamodb')

# 创建学生表
def create_students_table():
    table = dynamodb.create_table(
        TableName='Students',  # 确保表名与调用时一致
        KeySchema=[
            {
                'AttributeName': 'student-id',  # 分区键
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'student-id',
                'AttributeType': 'S'  # 字符串类型
            }
        ],
        BillingMode='PAY_PER_REQUEST'  # 使用按需计费模式
    )

    # 等待表格创建完成
    table.meta.client.get_waiter('table_exists').wait(TableName='Students')
    print(f"Table {table.table_name} created successfully.")

# 创建表格
create_students_table()