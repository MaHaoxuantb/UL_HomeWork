import requests
import json

# 配置参数
base_url = "https://nocodb.ulhw.org/api/v2"
table_id = "mqnejsdwrssyuiu"  # 替换为您的表 ID

# 替换为您的实际值
api_token = "_8T88SQjPUFLvrsOD2JvYu4cLWJkaGVJF_EE0DST"  # 请替换为新的 API Token

# 请求头
headers = {
    "xc-token": api_token,
    "Content-Type": "application/json"
}

# 函数：获取所有记录
def get_all_records():
    url = f"{base_url}/tables/{table_id}/records"
    querystring = {
        "offset": "0",
        "limit": "100"
    }
    try:
        response = requests.get(url, headers=headers, params=querystring)
        print(f"请求 URL: {response.url}")
        if response.status_code == 200:
            data = response.json()
            print("响应 JSON:")
            print(json.dumps(data, indent=4, ensure_ascii=False))
            records = data.get("data", [])
            if records:
                print("所有记录:")
                for record in records:
                    print(json.dumps(record, indent=4, ensure_ascii=False))
            else:
                print("未找到记录。")
        else:
            print(f"HTTP 请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"请求过程中发生错误: {e}")

# 函数：使用过滤条件获取记录
def get_filtered_records(column_name, desired_value):
    url = f"{base_url}/tables/{table_id}/records"
    filter_condition = {
        column_name: {
            "_eq": desired_value  # 使用 _eq 作为操作符
        }
    }
    querystring = {
        "offset": "0",
        "limit": "100",
        "where": json.dumps(filter_condition)
    }
    try:
        response = requests.get(url, headers=headers, params=querystring)
        print(f"请求 URL: {response.url}")
        if response.status_code == 200:
            data = response.json()
            print("响应 JSON:")
            print(json.dumps(data, indent=4, ensure_ascii=False))
            records = data.get("data", [])
            if records:
                print("符合条件的记录:")
                for record in records:
                    print(json.dumps(record, indent=4, ensure_ascii=False))
            else:
                print("未找到符合条件的记录。")
        else:
            print(f"HTTP 请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"请求过程中发生错误: {e}")

if __name__ == "__main__":
    print("=== 获取所有记录 ===")
    get_all_records()
    print("\n=== 获取过滤后的记录 ===")
    get_filtered_records("name", "ThomasB")




# _8T88SQjPUFLvrsOD2JvYu4cLWJkaGVJF_EE0DST