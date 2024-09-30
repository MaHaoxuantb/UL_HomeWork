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

function displayHomework(homeworkList) {
    const homeworkContainer = document.getElementById('homeworkContainer');
    homeworkContainer.innerHTML = ''; // 清空现有内容

    homeworkList.forEach((item, index) => {
        const homeworkItem = document.createElement('div');
        homeworkItem.className = 'homework-item';
        homeworkItem.setAttribute('data-subject', item['subject']);
        homeworkItem.setAttribute('data-status', item['completion-status']); // 直接使用 completion-status 的值
        homeworkItem.setAttribute('data-class-id', item['class-id']); // 设置 class-id 属性
        homeworkItem.setAttribute('data-assignment-id', item['assignment-id']); // 设置 assignment-id 属性

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

        // 添加作业到容器中
        homeworkContainer.appendChild(homeworkItem);

        // 当复选框状态变化时，触发API调用以通知后端
        const checkbox = homeworkItem.querySelector('.homework-status');
        checkbox.addEventListener('change', function () {
            const classId = homeworkItem.getAttribute('data-class-id'); // 从元素属性中获取 class-id
            const assignmentId = homeworkItem.getAttribute('data-assignment-id'); // 从元素属性中获取 assignment-id
            const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

            // 如果复选框被勾选，则发送完成作业请求
            if (checkbox.checked) {
                completeAssignment(studentId, classId, assignmentId, 'Complete');
            } else {
                completeAssignment(studentId, classId, assignmentId, 'Incomplete');
            }
        });

        // 添加展开按钮的事件监听
        const expandButton = homeworkItem.querySelector('.expand-button');
        if (expandButton) {
            expandButton.addEventListener('click', () => {
                const fullContent = homeworkItem.querySelector('.full-content');
                if (fullContent.style.display === 'none') {
                    fullContent.style.display = 'block'; // 显示完整内容
                    expandButton.textContent = 'Collapse'; // 修改按钮文本
                    homeworkItem.classList.add('expanded'); // 添加类以供CSS使用
                    
                    // 将按钮移动到展开内容的底部
                    fullContent.appendChild(expandButton.parentElement);
                } else {
                    fullContent.style.display = 'none'; // 隐藏完整内容
                    expandButton.textContent = 'Expand'; // 修改按钮文本
                    homeworkItem.classList.remove('expanded'); // 移除类以供CSS使用
                    
                    // 将按钮移动回原来的位置
                    homeworkItem.insertBefore(expandButton.parentElement, fullContent);
                }
            });
        }
    });

    // 初始排序和过滤
    sortHomework();
    filterByStatus();
}

// 完成作业的API调用函数
function completeAssignment(studentId, classId, assignmentId, status) {
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
        status: status // 发送作业的完成状态
      })
    })
    .then(response => {
      if (response.ok) {
        console.log('作业状态已更新');
      } else {
        console.error('更新作业状态时出错');
      }
    })
    .catch(error => {
      console.error('网络或服务器错误:', error);
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
