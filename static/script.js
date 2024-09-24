let token = '';  // 保存 JWT 令牌

// 用户登录
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            token = data.access_token;  // 保存 JWT 令牌
            alert('Logged in successfully!');
        } else {
            alert('Login failed');
        }
    })
    .catch(error => console.error('Error:', error));
});

// 添加作业
document.getElementById('assignmentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const assignment_title = document.getElementById('assignmentTitle').value;
    const assignment_content = document.getElementById('assignmentContent').value;
    const class_id = document.getElementById('classId').value;
    const due_date = document.getElementById('dueDate').value;

    fetch('http://127.0.0.1:8000/add_assignment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            class_id: class_id,
            assignment_title: assignment_title,
            assignment_content: assignment_content,
            due_date: due_date
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
});

// 获取学生的作业信息
document.getElementById('assignmentsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const student_id = document.getElementById('studentIdForAssignments').value;

    fetch('http://127.0.0.1:8000/get_assignments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            student_id: student_id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.length) {
            document.getElementById('result').innerHTML = `<h2>Assignments for ${student_id}</h2>`;
            data.forEach(assignment => {
                document.getElementById('result').innerHTML += `
                    <p>Assignment Title: ${assignment['assignment-title']}, Status: ${assignment['completion-status']}, Due Date: ${assignment['due-date']}</p>`;
            });
        } else {
            alert('No assignments found.');
        }
    })
    .catch(error => console.error('Error:', error));
});

// 获取学生信息
document.getElementById('studentInfoForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const student_id = document.getElementById('studentIdForInfo').value;

    fetch('http://127.0.0.1:8000/get_student_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            student_id: student_id
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerHTML = `<h2>Student Info:</h2><p>${JSON.stringify(data)}</p>`;
    })
    .catch(error => console.error('Error:', error));
});
