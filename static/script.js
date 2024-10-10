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

        // 添加事件监听器，监听完成状态选择框状态的变化
        document.getElementById('filter-finished').addEventListener('change', handleCheckboxChange);
        document.getElementById('filter-unfinished').addEventListener('change', handleCheckboxChange);

        // 添加事件监听器，监听科目选择框状态的变化
        const subjectCheckboxes = document.querySelectorAll('#filter-math, #filter-english, #filter-chemistry, #filter-physics, #filter-economics');
        subjectCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleSubjectCheckboxChange);
        });

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
            const response = await fetch('/get_student_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_id: studentId })
            });

            if (response.ok) {
                const userInfo = await response.json();
                const userName = userInfo.englishName;
                const role = userInfo.role; 

                // 更新页面内容为 "Hi, {name}"
                document.getElementById('user-name').textContent = userName;
                document.getElementById('login-btn').style.display = 'none';
                document.querySelector('.user-container').style.visibility = 'visible';
                document.querySelector('.user-container').style.opacity = '1';

                // 根据用户角色显示 Add Assignment 和 Edit Assignment 按钮
                const addAssignmentOption = document.getElementById('add-assignment-option');
                const editAssignmentOption = document.getElementById('edit-assignment-option'); // 新增 Edit Assignment 按钮

                if (role === 'assistant' || role === 'teacher' || role === 'admin') {
                    addAssignmentOption.style.visibility = 'visible';
                    editAssignmentOption.style.visibility = 'visible'; // 显示 Edit Assignment 按钮
                } else {
                    addAssignmentOption.style.visibility = 'hidden'; // 隐藏 Add Assignment 按钮
                    editAssignmentOption.style.visibility = 'hidden'; // 隐藏 Edit Assignment 按钮
                }
            }

        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }

        // 添加点击事件，显示或隐藏 Logout 和 Change Password 选项
        document.getElementById('user-info').addEventListener('click', function () {
            const logoutOption = document.getElementById('logout-option');
            const addAssignmentOption = document.getElementById('add-assignment-option');
            const editAssignmentOption = document.getElementById('edit-assignment-option'); // 新增 Edit Assignment 按钮
            const changePasswordOption = document.getElementById('change-password-option');
            const triangle = document.getElementById('triangle');

            if (!logoutOption.classList.contains('show')) {
                logoutOption.style.visibility = 'visible';
                addAssignmentOption.style.visibility = addAssignmentOption.style.visibility; // 按照当前设置显示或隐藏
                editAssignmentOption.style.visibility = editAssignmentOption.style.visibility; // 按照当前设置显示或隐藏
                changePasswordOption.style.visibility = 'visible'; // 显示 Change Password 选项
                logoutOption.classList.add('show');
                addAssignmentOption.classList.add('show');
                editAssignmentOption.classList.add('show'); // 显示 Edit Assignment 选项
                changePasswordOption.classList.add('show');
                triangle.classList.add('rotated');
            } else {
                logoutOption.classList.remove('show');
                addAssignmentOption.classList.remove('show');
                editAssignmentOption.classList.remove('show'); // 隐藏 Edit Assignment 选项
                changePasswordOption.classList.remove('show');
                triangle.classList.remove('rotated');
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

            // 在加载完作业后应用过滤器
            applyFilters();
        });

    console.log('Finished handling checkboxes.');

    isHandlingCheckboxChange = false;
    console.log('Buttons unlocked after loading assignments.');
}

// 处理科目选择框变化的函数
function handleSubjectCheckboxChange() {
    applyFilters();
}

async function fetchAssignments(apiEndpoint, lastEvaluatedKey = null, limit = 15) {
    const token = localStorage.getItem('jwtToken');  // 从 localStorage 获取 JWT 令牌

    // 检查 JWT 是否存在
    if (!token) {
        console.error("JWT token is missing");
        alert("Please Login");
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

        // 将新加载的作业追加到对应的数组中
        if (homeworkType === 'incomplete') {
            unfinishedHomework = unfinishedHomework.concat(result.items);
            localStorage.setItem('unfinishedHomework', JSON.stringify(unfinishedHomework)); // 记录到缓存
        } else if (homeworkType === 'complete') {
            finishedHomework = finishedHomework.concat(result.items);
            localStorage.setItem('finishedHomework', JSON.stringify(finishedHomework)); // 记录到缓存
        }

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

        // 在加载更多作业后应用过滤器
        applyFilters();
    }
}

// 防抖函数，延迟时间改为 1 秒
function debounce(func, delay = 1000) { // 默认延迟 1 秒
    if (debounceTimer) {
        clearTimeout(debounceTimer);  // 清除之前的定时器
    }
    debounceTimer = setTimeout(() => {
        func();  // 延迟结束后执行传入的函数
    }, delay);  // 设置新的定时器，延迟执行
}

// 完成作业的API调用函数
function completeAssignment(studentId, classId, assignmentId, status) {
    onsole.log('Sending completeAssignment with data:', { studentId, classId, assignmentId, status });
    fetch('/complete_assignment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
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
            console.log('作业状态已更新');
        } else {
            response.json().then(errorData => {
                console.error('更新作业状态时出错:', errorData);
                alert(`Error updating assignment status: ${errorData.error || errorData.message}`);
            });
        }
    })
    .catch(error => {
        console.error('网络或服务器错误:', error);
        alert('Network or server error occurred while updating assignment status.');
    });
}


async function replaceAssignments(apiEndpoint, homeworkType, container) {
    const result = await fetchAssignments(apiEndpoint);
    if (result) {
        container.innerHTML = ''; // 仅清空传入的 container
        displayAssignments(result.items, homeworkType, container); // 将作业插入指定容器

        // 将获取到的作业记录到对应的数组中
        if (homeworkType === 'incomplete') {
            unfinishedHomework = result.items;
            localStorage.setItem('unfinishedHomework', JSON.stringify(unfinishedHomework)); // 记录到缓存
        } else if (homeworkType === 'complete') {
            finishedHomework = result.items;
            localStorage.setItem('finishedHomework', JSON.stringify(finishedHomework)); // 记录到缓存
        }

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

        // 在替换作业后应用过滤器
        applyFilters();
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
        // 使用 setAttribute 设置作业的相关属性
        homeworkItem.setAttribute('data-subject', assignment['subject']);
        homeworkItem.setAttribute('data-teacher-name', assignment['teacher-name']);
        homeworkItem.setAttribute('data-submission-method', assignment['submission-method']);
        homeworkItem.setAttribute('data-status', assignment['completion-status']);
        homeworkItem.setAttribute('data-class-id', assignment['class-id']);
        homeworkItem.setAttribute('data-assignment-id', assignment['assignment-id']);

        const contentLines = assignment['assignment-content'].split('\n');

        // 生成作业的 HTML 结构，包括 subject, teacher_name 和 submission_method
        homeworkItem.innerHTML = `
            <p><strong>${assignment['subject']} - ${assignment['teacher-name']}</strong>
               (Submit via: ${assignment['submission-method']})
               <br>
               <em>${assignment['assignment-title']}</em> 
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

        console.log('Assignment data:', assignment);

        // 添加事件监听器用于更新完成状态
        const checkbox = homeworkItem.querySelector('.homework-status');
        checkbox.addEventListener('change', function () {
            const classId = homeworkItem.getAttribute('data-class-id');
            const assignmentId = homeworkItem.getAttribute('data-assignment-id');
            const studentId = localStorage.getItem('studentId');

            const newStatus = checkbox.checked ? 'Complete' : 'Incomplete';
            homeworkItem.setAttribute('data-status', newStatus);

            debounce(() => {
                completeAssignment(studentId, classId, assignmentId, newStatus);
            }, 1000);

            // 状态改变后重新应用过滤器
            applyFilters();
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

// 应用过滤器的函数
function applyFilters() {
    const filterFinished = document.getElementById('filter-finished').checked;
    const filterUnfinished = document.getElementById('filter-unfinished').checked;

    const selectedSubjects = [];
    const subjectCheckboxes = document.querySelectorAll('#filter-math, #filter-english, #filter-chemistry, #filter-physics, #filter-economics');
    subjectCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const subject = checkbox.id.replace('filter-', '').charAt(0).toUpperCase() + checkbox.id.replace('filter-', '').slice(1);
            selectedSubjects.push(subject);
        }
    });

    const allSubjectsSelected = selectedSubjects.length === 0;

    // 遍历所有作业项
    const homeworkItems = document.querySelectorAll('.homework-item');
    homeworkItems.forEach(item => {
        const itemSubject = item.getAttribute('data-subject');
        const itemStatus = item.getAttribute('data-status'); // 'Complete' or 'Incomplete'

        let subjectMatch = allSubjectsSelected || selectedSubjects.includes(itemSubject);
        let statusMatch = false;

        if (filterFinished && filterUnfinished) {
            // 两个过滤器都被勾选，显示所有
            statusMatch = true;
        } else if (!filterFinished && !filterUnfinished) {
            // 两个过滤器都未勾选，显示所有
            statusMatch = true;
        } else if (filterFinished && itemStatus === 'Complete') {
            statusMatch = true;
        } else if (filterUnfinished && itemStatus === 'Incomplete') {
            statusMatch = true;
        }

        if (subjectMatch && statusMatch) {
            // 显示作业项
            fadeIn(item);
        } else {
            // 隐藏作业项
            fadeOut(item);
        }
    });
}

// 淡出元素的函数
function fadeOut(element) {
    element.style.transition = 'opacity 0.5s ease-in-out';
    element.style.opacity = '0';
    element.addEventListener('transitionend', () => {
        element.style.display = 'none';
    }, { once: true });
}

// 淡入元素的函数
function fadeIn(element) {
    element.style.display = ''; // 重置 display 属性
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.5s ease-in-out';
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
}
