const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token

document.addEventListener('DOMContentLoaded', async function() {
    const dueDateInput = document.getElementById('due-date');
    const dueHourSelect = document.getElementById('due-hour');
    const dueMinuteSelect = document.getElementById('due-minute');
    const classIdSelect = document.getElementById('class-id');
    const subjectSelect = document.getElementById('subject');
    const teacherSelect = document.getElementById('teacher-name');

    const teachersBySubject = {
        Math: ['David Sagarino', 'Sanchia Yu'],
        English: ['Fiona Fan', 'Marissa Strachan'],
        Chemistry: ['Sheena Meng', 'Skyler Zhang'],
        Physics: ['Nathan Li', 'Damjan Gemovic'],
        Economics: ['Sisi Gao', 'Oliver Zhang']
    };

    // 设置默认日期和时间为上海时间
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
    const shanghaiDate = new Date(now);

    dueDateInput.value = shanghaiDate.toISOString().split('T')[0]; // 设置默认日期

    // 填充小时和分钟选择框
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

    // 动态更新 Teacher 选项
    subjectSelect.addEventListener('change', function() {
        const selectedSubject = subjectSelect.value;
        teacherSelect.innerHTML = '<option value="">Select Teacher</option>'; // 清空之前的选项

        if (teachersBySubject[selectedSubject]) {
            teachersBySubject[selectedSubject].forEach(function(teacher) {
                const option = document.createElement('option');
                option.value = teacher;
                option.textContent = teacher;
                teacherSelect.appendChild(option);
            });
        }
    });

    // 获取学生的班级 ID
    try {
        const response = await fetch('/get_student_info', {
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

// 提交表单事件处理
document.getElementById('add-assignment-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const classId = document.getElementById('class-id').value;
    const dueDate = document.getElementById('due-date').value;
    const dueHour = document.getElementById('due-hour').value;
    const dueMinute = document.getElementById('due-minute').value;
    const assignmentTitle = document.getElementById('assignment-title').value;
    const assignmentContent = document.getElementById('assignment-content').value;
    const teacherName = document.getElementById('teacher-name').value;  // 新增
    const submissionMethod = document.getElementById('submission-method').value;  // 新增
    const subject = document.getElementById('subject').value;  // 新增

    // 合并日期和时间
    const fullDueDate = `${dueDate} ${dueHour}:${dueMinute}`;

    const assignmentData = {
        class_id: classId,
        assignment_title: assignmentTitle,
        assignment_content: assignmentContent,
        due_date: fullDueDate,
        teacher_name: teacherName,  // 新增字段
        submission_method: submissionMethod,  // 新增字段
        subject: subject  // 新增字段
    };

    try {
        const response = await fetch('/add_assignment', {
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
