const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token

document.addEventListener('DOMContentLoaded', async function() {
    const dueDateInput = document.getElementById('due-date');
    const dueHourSelect = document.getElementById('due-hour');
    const dueMinuteSelect = document.getElementById('due-minute');
    const classIdSelect = document.getElementById('class-id');

    // Get current Shanghai time
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
    const shanghaiDate = new Date(now);

    // 设置默认日期和时间
    dueDateInput.value = shanghaiDate.toISOString().split('T')[0]; // 设置日期
    for (let i = 0; i < 24; i++) {
        const option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        option.textContent = i.toString().padStart(2, '0');
        dueHourSelect.appendChild(option);
    }
    for (let i = 0; i < 60; i++) {
        const option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        option.textContent = i.toString().padStart(2, '0');
        dueMinuteSelect.appendChild(option);
    }

    // Fetch class IDs for the student
    try {
        const response = await fetch('http://127.0.0.1:8000/get_student_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // 设置授权头
            },
            body: JSON.stringify({ student_id: localStorage.getItem('studentId') })
        });

        const result = await response.json();

        if (response.ok && result['class-ids']) {
            result['class-ids'].forEach(classId => {
                const option = document.createElement('option');
                option.value = classId; // 使用 class-id 值
                option.textContent = classId; // 显示在下拉框中的文本
                classIdSelect.appendChild(option);
            });
        } else {
            alert('无法获取班级信息。');
            console.error('Failed to fetch class information:', result);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

document.getElementById('add-assignment-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const classId = document.getElementById('class-id').value;
    const dueDate = document.getElementById('due-date').value;
    const dueHour = document.getElementById('due-hour').value;
    const dueMinute = document.getElementById('due-minute').value;
    const assignmentTitle = document.getElementById('assignment-title').value;
    const assignmentContent = document.getElementById('assignment-content').value;

    // Concatenate due date with hour and minute as a single string
    const fullDueDate = `${dueDate} ${dueHour}:${dueMinute}`;

    // 构建 assignmentData 对象
    const assignmentData = {
        class_id: classId,
        assignment_title: assignmentTitle,
        assignment_content: assignmentContent,
        due_date: fullDueDate // 修正为 ISO 格式的日期时间字符串
    };

    // 调试输出，检查 assignmentData 是否完整
    console.log("Assignment Data:", assignmentData);

    try {
        const response = await fetch('http://127.0.0.1:8000/add_assignment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(assignmentData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Assignment added successfully');
            window.location.href = '/';
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});
