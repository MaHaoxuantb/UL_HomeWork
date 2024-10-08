from datetime import datetime
import boto3
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize DynamoDB client and table
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table('Students')

# Add a student with a unique key (student-id) and a "key" attribute
# Add a student with a unique key (student-id) and a "key" attribute
def add_student(student_id, name, english_name, role, email, class_ids, age, gender, phone_number, key):
    enrollment_date = datetime.now().isoformat()  # Record enrollment date

    # Insert student information into the table
    response = students_table.put_item(
        Item={
            'student-id': student_id,   # Primary key: Student ID
            'key': key,                 # Additional key attribute (can be any unique or useful value)
            'name': name,               # Student name
            'englishName': english_name,  # Student English name
            'role': role,               # Student role (e.g., student, monitor, etc.)
            'email': email,             # Student email
            'class-ids': class_ids,     # List of class IDs the student is enrolled in
            'enrollment-date': enrollment_date,  # Date the student was added
            'age': age,                 # Student's age
            'gender': gender,           # Student's gender
            'phone-number': phone_number  # Student's phone number
        }
    )
    print(f"Student {name} added with student-id: {student_id} and key: {key}")

# Example data: Modify this section with actual student details
student_id = '12345'  # Unique student ID (primary key)
password = '12345'  # An additional key attribute, can be anything you choose
name = 'Ma Haoxuan'  # Student name
english_name = 'Mike'  # Student English name
role = 'admin'  # Student role
email = ''  # Student email
class_ids = ['Math101', 'Science102']  # Classes the student is enrolled in
age = 15  # Student age
gender = 'Male'  # Student gender
phone_number = '1234567890'  # Student phone number

key = generate_password_hash(password)

print(key)

# Add the student
add_student(student_id, name, english_name, role, email, class_ids, age, gender, phone_number, key)
