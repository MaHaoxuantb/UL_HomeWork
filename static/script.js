// 处理添加学生
document.getElementById('studentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const studentId = document.getElementById('studentId').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const classIds = document.getElementById('classIds').value.split(',');
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    fetch('http://0.0.0.0:8000/add_student', {  // 更新为运行 Flask 的 URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            student_id: studentId,
            name: name,
            email: email,
            class_ids: classIds,
            age: age,
            gender: gender,
            phone_number: phoneNumber
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    });
});

// 处理获取学生作业
document.getElementById('assignmentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const studentId = document.getElementById('queryStudentId').value;

    fetch('/get_student_assignments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            student_id: studentId
        })
    })
    .then(response => response.json())
    .then(data => {
        let resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '';

        if (data.error) {
            resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.message) {
            resultDiv.innerHTML = `<p>${data.message}</p>`;
        } else {
            data.forEach(assignment => {
                resultDiv.innerHTML += `<p>Assignment: ${JSON.stringify(assignment)}</p>`;
            });
        }
    });
});
