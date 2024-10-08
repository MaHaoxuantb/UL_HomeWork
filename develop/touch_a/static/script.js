let debounceTimer; // 用于防抖的定时器
let unfinishedHomework = [];
let finishedHomework = [];


document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token
    const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

    if (!token || !studentId) {
        /*alert('You are not logged in. Please log in first.');
        window.location.href = '/login'; // 如果没有登录信息，跳转到登录页面*/
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
    
                // 默认勾选"Unfinished"并应用过滤
                const filterUnfinished = document.getElementById('filter-unfinished');
                filterUnfinished.checked = true; // 默认勾选 Unfinished 选择框

                // 添加事件监听器，监听选择框状态的变化
                document.getElementById('filter-finished').addEventListener('change', updateHomeworkDisplay);
                document.getElementById('filter-unfinished').addEventListener('change', updateHomeworkDisplay);
                // 添加事件监听器，监听选择框状态的变化
                document.getElementById('filter-finished').addEventListener('change', handleCheckboxChange);
                document.getElementById('filter-unfinished').addEventListener('change', handleCheckboxChange);
                
                // 直接调用 updateHomeworkDisplay 来应用默认的过滤和排序逻辑
                updateHomeworkDisplay();
            } else {
                console.error('Failed to fetch homework');
                alert('Failed to load assignments.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching assignments.');
        }
    }
    if (!token) {
        // 没有 token 时显示 login 按钮
        document.getElementById('login-btn').style.display = 'block';
        document.querySelector('.user-container').style.visibility = 'hidden';
        document.querySelector('.user-container').style.opacity = '0';
    } else {
        // 有 token 时获取用户信息
        try {
            const studentId = localStorage.getItem('studentId'); // 假设 studentId 已存储
            const response = await fetch('http://127.0.0.1:8000/get_student_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_id: studentId })
            });

            if (response.ok) {
                const userInfo = await response.json();
                const userName = userInfo.name; // 假设 API 返回的字段是 name
                
                // 更新页面内容为 "Hi, {name}"
                document.getElementById('user-name').textContent = userName;
                document.getElementById('login-btn').style.display = 'none';
                document.querySelector('.user-container').style.visibility = 'visible';
                document.querySelector('.user-container').style.opacity = '1';
            }

        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }

        // 添加点击事件，显示或隐藏 Logout 选项
        document.getElementById('user-info').addEventListener('click', function () {
            const logoutOption = document.getElementById('logout-option');
            const addAssignmentOption = document.getElementById('add-assignment-option');
            const triangle = document.getElementById('triangle');
            
            if (!logoutOption.classList.contains('show')) {
                logoutOption.style.visibility = 'visible';
                addAssignmentOption.style.visibility = 'visible';
                logoutOption.classList.add('show'); // 显示 Logout 按钮
                addAssignmentOption.classList.add('show'); // 显示添加作业按钮
                triangle.classList.add('rotated'); // 旋转三角形指向下方
            } else {
                logoutOption.classList.remove('show'); // 隐藏 Logout 按钮
                addAssignmentOption.classList.remove('show'); // 隐藏添加作业按钮
                triangle.classList.remove('rotated'); // 旋转三角形指向上方
            }
        });
        
        
        
        
        

        // 点击 Logout，清除 token 并恢复 Login 按钮
        document.getElementById('logout-option').addEventListener('click', function () {
            localStorage.removeItem('jwtToken'); // 清除 token
            localStorage.removeItem('studentId'); // 清除 studentId
            document.getElementById('login-btn').style.display = 'block';
            document.querySelector('.user-container').style.visibility = 'hidden';
            document.querySelector('.user-container').style.opacity = '0';
        });
    }
});

function handleCheckboxChange() {
    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');

    // 选择框互斥逻辑
    if (this.id === 'filter-finished' && this.checked) {
        filterUnfinished.checked = false;
    } else if (this.id === 'filter-unfinished' && this.checked) {
        filterFinished.checked = false;
    }

    // 更新作业显示
    updateHomeworkDisplay();
}

// 防抖函数，延迟时间改为 5 秒
function debounce(func, delay = 5000) { // 默认延迟 5 秒
    if (debounceTimer) {
        clearTimeout(debounceTimer);  // 清除之前的定时器
    }
    debounceTimer = setTimeout(() => {
        func();  // 延迟结束后执行传入的函数
    }, delay);  // 设置新的定时器，延迟执行
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

function displayHomework(homeworkList) {
    const homeworkContainer = document.getElementById('homeworkContainer');
    homeworkContainer.innerHTML = ''; // 清空现有内容

    // 清空全局数组
    unfinishedHomework = [];
    finishedHomework = [];

    // 生成作业项并分类为已完成和未完成
    homeworkList.forEach((item) => {
        const homeworkItem = document.createElement('div');
        homeworkItem.className = 'homework-item';
        homeworkItem.setAttribute('data-subject', item['subject']);
        homeworkItem.setAttribute('data-status', item['completion-status']); // 直接使用 completion-status 的值
        homeworkItem.setAttribute('data-class-id', item['class-id']); // 设置 class-id 属性
        homeworkItem.setAttribute('data-assignment-id', item['assignment-id']); // 设置 assignment-id 属性

        // 获取作业内容的所有行
        const contentLines = item['assignment-content'].split('\n');

        homeworkItem.innerHTML = `
            <p><strong>${item['class-id']} - ${item['assignment-title']}</strong> (Submit via: ${item['submission-method']}) 
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

        // 将作业分类为已完成和未完成
        if (item['completion-status'] === 'Complete') {
            finishedHomework.push(homeworkItem);
        } else {
            unfinishedHomework.push(homeworkItem);
        }

        // 添加事件监听器，用于更新完成状态
        const checkbox = homeworkItem.querySelector('.homework-status');
        checkbox.addEventListener('change', function () {
            const classId = homeworkItem.getAttribute('data-class-id'); // 从元素属性中获取 class-id
            const assignmentId = homeworkItem.getAttribute('data-assignment-id'); // 从元素属性中获取 assignment-id
            const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

            debounce(() => {
                // 如果复选框被勾选，则发送完成作业请求
                const newStatus = checkbox.checked ? 'Complete' : 'Incomplete';
                completeAssignment(studentId, classId, assignmentId, newStatus);

                // 移动作业到正确的组
                if (checkbox.checked) {
                    // 从未完成作业中删除，添加到已完成作业中
                    unfinishedHomework = unfinishedHomework.filter(item => item !== homeworkItem);
                    finishedHomework.push(homeworkItem);
                } else {
                    // 从已完成作业中删除，添加到未完成作业中
                    finishedHomework = finishedHomework.filter(item => item !== homeworkItem);
                    unfinishedHomework.push(homeworkItem);
                }

                // 重新渲染作业列表
                updateHomeworkDisplay();
            }, 1000); // 1秒防抖间隔
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
                    fullContent.appendChild(expandButton.parentElement); // 将按钮移动到展开内容的底部
                } else {
                    fullContent.style.display = 'none'; // 隐藏完整内容
                    expandButton.textContent = 'Expand'; // 修改按钮文本
                    homeworkItem.classList.remove('expanded'); // 移除类以供CSS使用
                    homeworkItem.insertBefore(expandButton.parentElement, fullContent); // 将按钮移回原来的位置
                }
            });
        }
    });

    // 执行过滤和排序逻辑
    updateHomeworkDisplay(); // 不需要传递参数，直接使用全局数组
}




function updateHomeworkDisplay() {
    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');
    const homeworkContainer = document.getElementById('homeworkContainer');

    // 清空作业列表
    homeworkContainer.innerHTML = '';

    // 重新创建标题并添加到容器中
    const homeworkTitle = document.createElement('h3');
    homeworkTitle.textContent = 'Homework Assignments';
    homeworkContainer.appendChild(homeworkTitle);

    // 如果两个复选框都没有勾选，先展示未完成作业（时间从前往后），再展示已完成作业（时间从后往前）
    if (!filterFinished.checked && !filterUnfinished.checked) {
        unfinishedHomework.sort((a, b) => {
            const dateA = new Date(a.querySelector('.due-date').textContent.replace('Due: ', ''));
            const dateB = new Date(b.querySelector('.due-date').textContent.replace('Due: ', ''));
            return dateA - dateB;
        });
        finishedHomework.sort((a, b) => {
            const dateA = new Date(a.querySelector('.due-date').textContent.replace('Due: ', ''));
            const dateB = new Date(b.querySelector('.due-date').textContent.replace('Due: ', ''));
            return dateB - dateA;
        });

        unfinishedHomework.forEach(item => homeworkContainer.appendChild(item));
        finishedHomework.forEach(item => homeworkContainer.appendChild(item));
    }
    // 如果只勾选了 "Unfinished"，显示未完成作业（按时间从前往后排序）
    else if (filterUnfinished.checked) {
        unfinishedHomework.sort((a, b) => {
            const dateA = new Date(a.querySelector('.due-date').textContent.replace('Due: ', ''));
            const dateB = new Date(b.querySelector('.due-date').textContent.replace('Due: ', ''));
            return dateA - dateB;
        });
        unfinishedHomework.forEach(item => homeworkContainer.appendChild(item));
    }
    // 如果只勾选了 "Finished"，显示已完成作业（按时间从后往前排序）
    else if (filterFinished.checked) {
        finishedHomework.sort((a, b) => {
            const dateA = new Date(a.querySelector('.due-date').textContent.replace('Due: ', ''));
            const dateB = new Date(b.querySelector('.due-date').textContent.replace('Due: ', ''));
            return dateB - dateA;
        });
        finishedHomework.forEach(item => homeworkContainer.appendChild(item));
    }
}

updateHomeworkDisplay()