const token = localStorage.getItem('jwtToken'); // 从 LocalStorage 获取 token

document.addEventListener('DOMContentLoaded', async function() {
    const dueDateInput = document.getElementById('due-date');
    const dueHourInput = document.getElementById('due-hour');
    const dueMinuteInput = document.getElementById('due-minute');
    const classIdSelect = document.getElementById('class-id');
    const subjectSelect = document.getElementById('subject');
    const teacherSelect = document.getElementById('teacher-name');
    const submissionMethodSelect = document.getElementById('submission-method');
    const assignmentTitleInput = document.getElementById('assignment-title');
    const assignmentContentInput = document.getElementById('assignment-content');
    const updateBtn = document.getElementById('update-btn');

    const teachersBySubject = {
        Math: ['David Sagarino', 'Sanchia Yu'],
        English: ['Fiona Fan', 'Marissa Strachan'],
        Chemistry: ['Sheena Meng', 'Skyler Zhang'],
        Physics: ['Nathan Li', 'Damjan Gemovic'],
        Economics: ['Sisi Gao', 'Oliver Zhang']
    };

    // 设置默认日期为上海时间
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
    const shanghaiDate = new Date(now);
    dueDateInput.value = shanghaiDate.toISOString().split('T')[0]; // 设置默认日期

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
                'Authorization': `Bearer ${token}` // 设置授权头
            },
            body: JSON.stringify({ student_id: localStorage.getItem('studentId') })
        });

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch class information: ${response.status} ${errorText}`);
        }

        const result = await response.json();

        if (result['class-ids']) {
            result['class-ids'].forEach(classId => {
                const option = document.createElement('option');
                option.value = classId; // 使用 class-id 值
                option.textContent = classId; // 显示在下拉框中的文本
                classIdSelect.appendChild(option);
            });
        } else {
            alert('无法获取班级信息。');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }

    // 解析 URL 中的 assignment_id
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('assignment_id');

    if (assignmentId) {
        // 如果存在 assignment_id，则为编辑模式
        loadAssignmentDetails(assignmentId);
    }

    // 加载特定 assignment 的详细信息从本地存储
    function loadAssignmentDetails(assignmentId) {
        const unfinishedHomework = JSON.parse(localStorage.getItem('unfinishedHomework')) || [];
        const finishedHomework = JSON.parse(localStorage.getItem('finishedHomework')) || [];
        const allAssignments = [...unfinishedHomework, ...finishedHomework];

        const assignment = allAssignments.find(a => a['assignment-id'] === assignmentId);

        if (assignment) {
            // 填充小时选择框
            for (let i = 0; i < 24; i++) {
                const option = document.createElement('option');
                option.value = i.toString().padStart(2, '0');
                option.textContent = i.toString().padStart(2, '0');
                dueHourInput.appendChild(option);
            }

            // 填充分钟选择框
            for (let i = 0; i < 60; i++) {
                const option = document.createElement('option');
                option.value = i.toString().padStart(2, '0');
                option.textContent = i.toString().padStart(2, '0');
                dueMinuteInput.appendChild(option);
            }

            // 解析日期和时间
            const [datePart, timePart] = assignment['due-date'].split(' ');
            const [dueHour, dueMinute] = timePart.split(':');

            dueDateInput.value = datePart;
            dueHourInput.value = dueHour.padStart(2, '0'); // 确保小时格式为两位数
            dueMinuteInput.value = dueMinute.padStart(2, '0'); // 确保分钟格式为两位数

            subjectSelect.value = assignment['subject'];
            subjectSelect.dispatchEvent(new Event('change'));

            setTimeout(() => {
                teacherSelect.value = assignment['teacher-name'];
            }, 100);

            classIdSelect.value = assignment['class-id'];
            submissionMethodSelect.value = assignment['submission-method'];
            assignmentTitleInput.value = assignment['assignment-title'];
            assignmentContentInput.value = assignment['assignment-content'];
        } else {
            alert('未找到对应的作业详情。');
        }
    }

    // 提交表单事件处理
    document.getElementById('edit-assignment-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const classId = classIdSelect.value;
        const dueDate = dueDateInput.value;
        const dueHour = dueHourInput.value;
        const dueMinute = dueMinuteInput.value;
        const subject = subjectSelect.value;
        const teacherName = teacherSelect.value;
        const submissionMethod = submissionMethodSelect.value;
        const assignmentTitle = assignmentTitleInput.value;
        const assignmentContent = assignmentContentInput.value;

        // 合并日期和时间
        const fullDueDate = `${dueDate} ${dueHour}:${dueMinute}`;

        const assignmentData = {
            'class_id': classId,
            'due_date': fullDueDate,
            'subject': subject,
            'teacher_name': teacherName,
            'submission_method': submissionMethod,
            'assignment_title': assignmentTitle,
            'assignment_content': assignmentContent
        };

        if (assignmentId) {
            assignmentData['assignment_id'] = assignmentId;
        }

        try {
            const endpoint = assignmentId ? '/edit_assignment' : '/add_assignment';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assignmentData)
            });

            if (!response.ok) {
                throw new Error(`Failed to submit assignment: ${response.status}`);
            }

            const result = await response.json();
            if (assignmentId) {
                updateLocalStorage(assignmentData);
            } else {
                addToLocalStorage({
                    ...assignmentData,
                    'assignment-id': result.assignment_id,
                    'completion-status': 'Incomplete'
                });
            }

            window.location.href = '/';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // 更新本地存储中的作业（编辑）
    function updateLocalStorage(updatedAssignment) {
        let unfinishedHomework = JSON.parse(localStorage.getItem('unfinishedHomework')) || [];
        let finishedHomework = JSON.parse(localStorage.getItem('finishedHomework')) || [];

        const allAssignments = [...unfinishedHomework, ...finishedHomework];
        const index = allAssignments.findIndex(a => a['assignment-id'] === updatedAssignment['assignment_id']);

        if (index !== -1) {
            allAssignments[index] = {
                ...allAssignments[index],
                'class-id': updatedAssignment.class_id,
                'due-date': updatedAssignment.due_date,
                'subject': updatedAssignment.subject,
                'teacher-name': updatedAssignment.teacher_name,
                'submission-method': updatedAssignment.submission_method,
                'assignment-title': updatedAssignment.assignment_title,
                'assignment-content': updatedAssignment.assignment_content
            };

            unfinishedHomework = allAssignments.filter(a => a['completion-status'] === 'Incomplete');
            finishedHomework = allAssignments.filter(a => a['completion-status'] === 'Complete');

            localStorage.setItem('unfinishedHomework', JSON.stringify(unfinishedHomework));
            localStorage.setItem('finishedHomework', JSON.stringify(finishedHomework));
        }
    }

    // 添加新作业到本地存储
    function addToLocalStorage(newAssignment) {
        let unfinishedHomework = JSON.parse(localStorage.getItem('unfinishedHomework')) || [];
        unfinishedHomework.push(newAssignment);
        localStorage.setItem('unfinishedHomework', JSON.stringify(unfinishedHomework));
    }
});
