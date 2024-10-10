const token = localStorage.getItem('jwtToken'); // 从 LocalStorage 获取 token

document.addEventListener('DOMContentLoaded', async function() {
    const dueDateInput = document.getElementById('due-date');
    const classIdSelect = document.getElementById('class-id');
    const subjectSelect = document.getElementById('subject');
    const teacherSelect = document.getElementById('teacher-name');
    const submissionMethod = document.getElementById('submission-method');
    const assignmentTitle = document.getElementById('assignment-title');
    const assignmentContent = document.getElementById('assignment-content');

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

    // 添加事件监听器以触发作业检查
    classIdSelect.addEventListener('change', debounce(checkAssignment, 300));
    dueDateInput.addEventListener('change', debounce(checkAssignment, 300));
    subjectSelect.addEventListener('change', debounce(checkAssignment, 300));
    teacherSelect.addEventListener('change', debounce(checkAssignment, 300));

    // 防抖函数，避免频繁调用 API
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function checkAssignment() {
        const classId = classIdSelect.value;
        const dueDate = dueDateInput.value;
        const subject = subjectSelect.value;
        const teacherName = teacherSelect.value;

        // 仅在所有字段都有值时进行搜索
        if (!classId || !dueDate || !subject || !teacherName) {
            console.log('Incomplete fields, skipping assignment check.');
            return;
        }

        console.log('Checking assignment with:', { classId, dueDate, subject, teacherName });

        try {
            const allAssignments = await fetchAllAssignments();
            console.log(`Fetched ${allAssignments.length} assignments.`);
            console.log('All Assignments:', allAssignments); // 查看所有作业数据

            // 搜索匹配的作业
            const matchingAssignment = allAssignments.find(a => 
                a['class-id'] === classId && 
                a['due-date'].split(' ')[0] === dueDate && // 修改这里，从 'T' 改为 ' '
                a['subject'] === subject && 
                a['teacher-name'] === teacherName
            );

            console.log('Matching Assignment:', matchingAssignment);

            if (matchingAssignment) {
                // 填充 Submission Method
                submissionMethod.value = matchingAssignment['submission-method'] || '';
                // 填充 Assignment Title 和 Content
                assignmentTitle.value = matchingAssignment['assignment-title'] || '';
                assignmentContent.value = matchingAssignment['assignment-content'] || '';
                console.log('Form fields updated.');
            } else {
                // 清空作业信息
                submissionMethod.value = '';
                assignmentTitle.value = '';
                assignmentContent.value = '';
                console.log('No matching assignment found. Form fields cleared.');
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            alert(`Error fetching assignments: ${error.message}`);
        }
    }

    // 函数：递归获取所有作业（处理分页）
    async function fetchAllAssignments() {
        let allAssignments = [];
        let lastEvaluatedKey = null;
        const limit = 50; // 每次请求的数量，根据需要调整

        do {
            const url = new URL('/all_assignments');
            url.searchParams.append('limit', limit);
            if (lastEvaluatedKey) {
                url.searchParams.append('last_evaluated_key', JSON.stringify(lastEvaluatedKey));
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to fetch assignments');
            }

            const result = await response.json();
            console.log('Fetched page with', result.items.length, 'assignments.');
            allAssignments = allAssignments.concat(result.items);
            lastEvaluatedKey = result.last_evaluated_key ? JSON.parse(lastEvaluatedKey) : null;
        } while (lastEvaluatedKey);

        return allAssignments;
    }

    // 提交表单事件处理
    document.getElementById('edit-assignment-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const classId = classIdSelect.value;
        const dueDate = dueDateInput.value;
        const subject = subjectSelect.value;
        const teacherName = teacherSelect.value;
        const submissionMethodValue = submissionMethod.value;
        const assignmentTitleValue = assignmentTitle.value;
        const assignmentContentValue = assignmentContent.value;

        const assignmentData = {
            'class_id': classId,
            'due_date': dueDate,
            'subject': subject,
            'teacher_name': teacherName,
            'submission_method': submissionMethodValue,
            'assignment_title': assignmentTitleValue,
            'assignment_content': assignmentContentValue
        };

        console.log('Submitting assignment data:', assignmentData);

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
                alert('Assignment updated successfully');
                window.location.href = '/';
            } else {
                alert(`Error: ${result.error}`);
                console.error('Error response:', result);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Submission error:', error);
        }
    });
});
