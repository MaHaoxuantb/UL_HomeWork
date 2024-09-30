document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token
    const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

    if (!token || !studentId) {
        alert('You are not logged in. Please log in first.');
        window.location.href = '/login'; // 如果没有登录信息，跳转到登录页面
    } else {
        try {
            // 使用 JWT 令牌获取作业
            const response = await fetch('http://127.0.0.1:8000/get_assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 设置授权头
                },
                body: JSON.stringify({ student_id: studentId })
            });

            if (response.ok) {
                const homeworkList = await response.json();
                displayHomework(homeworkList); // 调用函数显示作业
                monitorHomeworkStatus(); // 开始监听作业状态
            } else {
                console.error('Failed to fetch homework');
                alert('Failed to load assignments.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching assignments.');
        }
    }
});

let homeworkStatusBaseline = {}; // 存储初始的作业状态

function displayHomework(homeworkList) {
    const homeworkContainer = document.getElementById('homeworkContainer');
    homeworkContainer.innerHTML = ''; // 清空现有内容

    homeworkList.forEach((item, index) => {
        const homeworkItem = document.createElement('div');
        homeworkItem.className = 'homework-item';
        homeworkItem.setAttribute('data-assignment-id', item['assignment-id']); // 设置 assignment-id 属性
        homeworkItem.setAttribute('data-class-id', item['class-id']); // 设置 class-id 属性
        homeworkItem.setAttribute('data-status', item['completion-status']); // 设置完成状态

        // 获取作业内容的所有行
        const contentLines = item['assignment-content'].split('\n');

        homeworkItem.innerHTML = `
            <p><strong>${item['subject']} - ${item['assignment-title']}</strong> (Submit via: ${item['submission-method']}) 
               <span class="due-date">Due: ${item['due-date']}</span></p>
            <ul>
                ${contentLines.slice(0, 3).map(content => `<li>${content}</li>`).join('')} <!-- 默认显示前三行作业内容 -->
            </ul>
            ${contentLines.length > 3 ? `<div class="expand"><a class="expand-button">Expand</a></div>` : ''}
            <div class="full-content" style="display: none;">
                <ul>
                    ${contentLines.slice(3).map(content => `<li>${content}</li>`).join('')} <!-- 显示第四行及以下内容 -->
                </ul>
            </div>
            <div class="homework-status-container">
                <label><input type="checkbox" class="homework-status" ${item['completion-status'] === 'Complete' ? 'checked' : ''}> Finished</label>
            </div>
        `;

        // 初始化基准状态
        homeworkStatusBaseline[item['assignment-id']] = item['completion-status'];

        // 添加作业到容器中
        homeworkContainer.appendChild(homeworkItem);
    });

    // 添加监听展开/收起按钮和其他功能
    setupExpandButtons();
    sortHomework(); // 初始显示时进行排序
}

function setupExpandButtons() {
    const homeworkItems = document.querySelectorAll('.homework-item');
    homeworkItems.forEach(item => {
        const expandButton = item.querySelector('.expand-button');
        if (expandButton) {
            expandButton.addEventListener('click', () => {
                const fullContent = item.querySelector('.full-content');
                if (fullContent.style.display === 'none') {
                    fullContent.style.display = 'block';
                    expandButton.textContent = 'Collapse';
                } else {
                    fullContent.style.display = 'none';
                    expandButton.textContent = 'Expand';
                }
            });
        }
    });
}

function monitorHomeworkStatus() {
    setInterval(() => {
        const homeworkItems = document.querySelectorAll('.homework-item');

        homeworkItems.forEach(item => {
            const assignmentId = item.getAttribute('data-assignment-id');
            const classId = item.getAttribute('data-class-id');
            const checkbox = item.querySelector('.homework-status');
            const currentStatus = checkbox.checked ? 'Complete' : 'Incomplete';

            // 比较当前状态和基准状态
            if (homeworkStatusBaseline[assignmentId] !== currentStatus) {
                // 状态有变化，发送请求到后端
                updateAssignmentStatus(classId, assignmentId, currentStatus);

                // 更新基准状态
                homeworkStatusBaseline[assignmentId] = currentStatus;
            }
        });

        // 状态检查后重新排序
        sortHomework();
    }, 30000); // 每30秒检查一次状态
}

function updateAssignmentStatus(classId, assignmentId, status) {
    const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId
    fetch('/complete_assignment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // 假设JWT存储在本地
        },
        body: JSON.stringify({
            student_id: studentId,
            class_id: classId,
            assignment_id: assignmentId,
            status: status
        })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Assignment ${assignmentId} status updated to ${status}`);
        } else {
            console.error('Error updating assignment status');
        }
    })
    .catch(error => {
        console.error('Network or server error:', error);
    });
}

// 初始排序功能
function sortHomework() {
    const homeworkItems = document.querySelectorAll('.homework-item');
    const container = document.querySelector('.homework-list');
    const sortedItems = Array.from(homeworkItems).sort((a, b) => {
        const dateA = new Date(a.querySelector('.due-date').textContent.replace('Due: ', ''));
        const dateB = new Date(b.querySelector('.due-date').textContent.replace('Due: ', ''));
        return dateA - dateB;
    });
    sortedItems.forEach(item => container.appendChild(item));
}

// 根据完成状态进行过滤
function filterByStatus() {
    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');
    const homeworkItems = document.querySelectorAll('.homework-item');

    homeworkItems.forEach(item => {
        const isFinished = item.querySelector('.homework-status').checked;
        const showFinished = filterFinished.checked;
        const showUnfinished = filterUnfinished.checked;

        if (showFinished && !isFinished) {
            item.style.display = 'none';
        } else if (showUnfinished && isFinished) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });

    sortHomework(); // 重新排序
}
