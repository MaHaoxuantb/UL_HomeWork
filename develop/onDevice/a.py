import requests
import json

# 配置参数
url = "https://nocodb.ulhw.org/api/v2/tables/mqnejsdwrssyuiu/columns"

# 替换为您的实际值
api_token = "_8T88SQjPUFLvrsOD2JvYu4cLWJkaGVJF_EE0DST"  # 请替换为新的 API Token

# 请求头
headers = {
    "xc-token": api_token,
    "Content-Type": "application/json"
}

try:
    # 发送 GET 请求以获取列信息
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        columns = response.json()
        print("表的列信息:")
        for column in columns:
            print(f"列名: {column.get('name')}, 列 ID: {column.get('id')}, 类型: {column.get('type')}")
    else:
        print(f"无法获取列信息，状态码: {response.status_code}")
        print(f"响应内容: {response.text}")

except requests.exceptions.RequestException as e:
    print(f"请求过程中发生错误: {e}")
