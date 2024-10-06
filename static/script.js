let debounceTimer; // 用于防抖的定时器
let unfinishedHomework = [];
let finishedHomework = [];
let isHandlingCheckboxChange = false;

document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token
    const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

    if (!token || !studentId) {
        // 用户未登录时，提示用户并跳转到登录页面
        /*alert('You are not logged in. Please log in first.');
        window.location.href = '/login'; // 如果没有登录信息，跳转到登录页面*/
    } else {
        // 默认勾选 "Unfinished" 选择框
        const filterUnfinished = document.getElementById('filter-unfinished');
        filterUnfinished.checked = true; // 默认勾选 Unfinished 选择框
    
        // 添加事件监听器，监听选择框状态的变化
        document.getElementById('filter-finished').addEventListener('change', handleCheckboxChange);
        document.getElementById('filter-unfinished').addEventListener('change', handleCheckboxChange);
    
        // 调用 handleCheckboxChange 来根据默认的 "Unfinished" 状态加载作业
        handleCheckboxChange.call(filterUnfinished);
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
    if (isHandlingCheckboxChange) {
        return; // 如果当前已经在处理选项变更，则直接返回
    }
    isHandlingCheckboxChange = true;

    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');

    // 使用事件对象来确定哪个复选框被点击
    const target = event.target;

    if (target.id === 'filter-finished') {
        filterUnfinished.checked = false;
    } else if (target.id === 'filter-unfinished') {
        filterFinished.checked = false;
    }

    console.log('Checkbox states:', { filterFinished: filterFinished.checked, filterUnfinished: filterUnfinished.checked });

    // 锁定按钮以避免重复操作
    filterFinished.disabled = true;
    filterUnfinished.disabled = true;
    console.log('Buttons locked.');

    const homeworkContainer = document.getElementById('homeworkContainer');

    // 动态创建未完成和已完成作业的子容器
    let unfinishedContainer = document.getElementById('unfinishedHomeworkContainer');
    let finishedContainer = document.getElementById('finishedHomeworkContainer');

    // 如果容器不存在，动态创建它们
    if (!unfinishedContainer) {
        unfinishedContainer = document.createElement('div');
        unfinishedContainer.id = 'unfinishedHomeworkContainer';
        homeworkContainer.appendChild(unfinishedContainer);
    }

    if (!finishedContainer) {
        finishedContainer = document.createElement('div');
        finishedContainer.id = 'finishedHomeworkContainer';
        homeworkContainer.appendChild(finishedContainer);
    }

    // 清空容器日志
    console.log('Clearing containers...');
    unfinishedContainer.innerHTML = '';
    finishedContainer.innerHTML = '';

    let loadAssignmentsPromise;
    if (filterFinished.checked) {
        loadAssignmentsPromise = replaceAssignments('/completed_assignments', 'complete', finishedContainer);
    } else if (filterUnfinished.checked) {
        loadAssignmentsPromise = replaceAssignments('/incomplete_assignments', 'incomplete', unfinishedContainer);
    } else {
        loadAssignmentsPromise = Promise.all([
            replaceAssignments('/incomplete_assignments', 'incomplete', unfinishedContainer),
            replaceAssignments('/completed_assignments', 'complete', finishedContainer)
        ]);
    }
    

    loadAssignmentsPromise
        .finally(() => {
            filterFinished.disabled = false;
            filterUnfinished.disabled = false;
            isHandlingCheckboxChange = false;
            console.log('Buttons unlocked after loading assignments.');
        });

    console.log('Finished handling checkboxes.');
    
    isHandlingCheckboxChange = false;
    console.log('Buttons unlocked after loading assignments.');
}




async function fetchAssignments(apiEndpoint, lastEvaluatedKey = null, limit = 15) {
    const token = localStorage.getItem('jwtToken');  // 从 localStorage 获取 JWT 令牌

    // 检查 JWT 是否存在
    if (!token) {
        console.error("JWT token is missing");
        alert("JWT token is missing, please log in.");
        return;
    }

    const url = new URL(apiEndpoint, window.location.origin); // 构造API的URL

    // 添加查询参数
    url.searchParams.append('limit', limit);
    if (lastEvaluatedKey) {
        // 将 last_evaluated_key 转换为 JSON 字符串
        url.searchParams.append('last_evaluated_key', JSON.stringify(lastEvaluatedKey));
    }

    try {
        // 发起GET请求
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // 添加JWT到请求头
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            return await response.json();  // 返回响应数据
        } else {
            const errorData = await response.json();
            console.error('API请求失败:', errorData);
            alert(`Failed to load assignments: ${errorData.msg || errorData.error}`);
        }
    } catch (error) {
        console.error('请求发生错误:', error);
        alert('An error occurred while fetching assignments.');
    }
}


async function loadMoreAssignments(apiEndpoint, lastEvaluatedKey = null, homeworkType, container) {
    const result = await fetchAssignments(apiEndpoint, lastEvaluatedKey);
    if (result) {
        // 追加作业但不清空容器
        displayAssignments(result.items, homeworkType, container);

        // 显示更多按钮逻辑
        const loadMoreButton = document.getElementById('loadMoreButton');
        if (result.items.length === 15 && result.last_evaluated_key) { // 同样检查数量
            loadMoreButton.style.display = 'block';
            loadMoreButton.onclick = () => {
                loadMoreAssignments(apiEndpoint, result.last_evaluated_key, homeworkType, container);
            };
        } else {
            loadMoreButton.style.display = 'none';
        }
    }
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

async function replaceAssignments(apiEndpoint, homeworkType, container) {
    const result = await fetchAssignments(apiEndpoint);
    if (result) {
        container.innerHTML = ''; // 仅清空传入的 container
        displayAssignments(result.items, homeworkType, container); // 将作业插入指定容器

        // 处理 Load More 按钮
        const loadMoreButton = document.getElementById('loadMoreButton');
        if (result.items.length === 15 && result.last_evaluated_key) { // 假设每次加载15个
            loadMoreButton.style.display = 'block';
            loadMoreButton.onclick = () => {
                loadMoreAssignments(apiEndpoint, result.last_evaluated_key, homeworkType, container);
            };
        } else {
            loadMoreButton.style.display = 'none';
        }
    }
}


async function insertAssignments(apiEndpoint, homeworkType, container) {
    const result = await fetchAssignments(apiEndpoint);
    if (result) {
        displayAssignments(result.items, homeworkType, container); // 将作业插入指定容器

        // 处理 Load More 按钮
        const loadMoreButton = document.getElementById('loadMoreButton');
        if (result.last_evaluated_key) {
            loadMoreButton.style.display = 'block';
            loadMoreButton.onclick = () => {
                loadMoreAssignments(apiEndpoint, result.last_evaluated_key, homeworkType, container);
            };
        } else {
            loadMoreButton.style.display = 'none';
        }
    }
}


// 显示作业的函数
function displayAssignments(assignments, homeworkType, container) {
    const homeworkContainer = document.getElementById('homeworkContainer');

    // 确保 Homework Assignments 标题始终在容器顶部
    const titleElement = document.getElementById('homeworkTitle');
    if (titleElement && homeworkContainer.firstChild !== titleElement) {
        homeworkContainer.insertBefore(titleElement, homeworkContainer.firstChild);
    }

    assignments.forEach(assignment => {
        const homeworkItem = document.createElement('div');
        homeworkItem.className = 'homework-item';
        homeworkItem.setAttribute('data-subject', assignment['subject']);
        homeworkItem.setAttribute('data-status', assignment['completion-status']);
        homeworkItem.setAttribute('data-class-id', assignment['class-id']);
        homeworkItem.setAttribute('data-assignment-id', assignment['assignment-id']);

        const contentLines = assignment['assignment-content'].split('\n');

        homeworkItem.innerHTML = `
            <p><strong>${assignment['class-id']} - ${assignment['assignment-title']}</strong>
               (Submit via: ${assignment['submission-method']})
               <span class="due-date">Due: ${assignment['due-date']}</span></p>
            <ul>
                ${contentLines.slice(0, 7).map(content => `<li>${content}</li>`).join('')}
            </ul>
            ${contentLines.length > 7 ? `<div class="expand"><a class="expand-button">Expand</a></div>` : ''}
            <div class="full-content" style="display: none;">
                <ul>
                    ${contentLines.slice(7).map(content => `<li>${content}</li>`).join('')}
                </ul>
            </div>
            <div class="homework-status-container">
                <label><input type="checkbox" class="homework-status"
                    ${assignment['completion-status'] === 'Complete' ? 'checked' : ''}> Finished</label>
            </div>
        `;

        // 添加事件监听器用于更新完成状态
        const checkbox = homeworkItem.querySelector('.homework-status');
        checkbox.addEventListener('change', function () {
            const classId = homeworkItem.getAttribute('data-class-id');
            const assignmentId = homeworkItem.getAttribute('data-assignment-id');
            const studentId = localStorage.getItem('studentId');

            debounce(() => {
                const newStatus = checkbox.checked ? 'Complete' : 'Incomplete';
                completeAssignment(studentId, classId, assignmentId, newStatus);
            }, 1000);
        });

        // 添加展开/收起功能
        const expandButton = homeworkItem.querySelector('.expand-button');
        if (expandButton) {
            expandButton.addEventListener('click', () => {
                const fullContent = homeworkItem.querySelector('.full-content');
                if (fullContent.style.display === 'none') {
                    fullContent.style.display = 'block';
                    expandButton.textContent = 'Collapse';
                    homeworkItem.classList.add('expanded');
                    fullContent.appendChild(expandButton.parentElement);
                } else {
                    fullContent.style.display = 'none';
                    expandButton.textContent = 'Expand';
                    homeworkItem.classList.remove('expanded');
                    homeworkItem.insertBefore(expandButton.parentElement, fullContent);
                }
            });
        }

        /// 添加淡入效果并追加作业到容器中
        container.appendChild(homeworkItem);
        fadeIn(homeworkItem);
    });

    // 修正最后一项作业的高度，防止 Expand 按钮被遮挡
    const lastHomeworkItem = homeworkContainer.lastElementChild;
    if (lastHomeworkItem) {
        lastHomeworkItem.style.marginBottom = '20px';
    }
}


// 淡出并移除元素的函数
function fadeOutAndRemove(element) {
    element.style.transition = 'opacity 0.5s ease-in-out';
    element.style.opacity = '0';
    element.addEventListener('transitionend', () => {
        element.remove();
    }, { once: true });
}

// 隐藏作业的函数
function hideAssignmentsByType(type) {
    const homeworkContainer = document.getElementById('homeworkContainer');
    const assignmentsToHide = homeworkContainer.querySelectorAll(`.homework-item[data-status="${type === 'incomplete' ? 'Incomplete' : 'Complete'}"]`);
    
    assignmentsToHide.forEach(item => {
        item.style.display = 'none';
    });
}

// 淡入元素的函数
function fadeIn(element) {
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.5s ease-in-out';
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
}


