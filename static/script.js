let debounceTimer; // 用于防抖的定时器
let unfinishedHomework = [];
let finishedHomework = [];
let isHandlingCheckboxChange = false;

document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('jwtToken'); // 从 localStorage 获取 token
    const studentId = localStorage.getItem('studentId'); // 从 localStorage 获取 studentId

    if (!token || !studentId) {
        // 用户未登录时，提示用户并跳转到登录页面
        alert('您尚未登录，请先登录。');
        window.location.href = '/login'; // 如果没有登录信息，跳转到登录页面
        return;
    }

    // 有 token 时获取用户信息
    try {
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
            
            // 存储角色信息到 localStorage
            localStorage.setItem('role', role);

            // 更新页面内容为 "Hi, {name}"
            document.getElementById('user-name').textContent = `Hi, ${userName}`;
            document.getElementById('login-btn').style.display = 'none';

            // 显示 user-container
            document.querySelector('.user-container').style.display = 'flex';
            document.getElementById('login-btn').style.display = 'none';

            // 根据用户角色显示 Add Assignment 和 Edit Assignment 按钮
            const addAssignmentOption = document.getElementById('add-assignment-option');

            if (['assistant', 'teacher', 'admin'].includes(role)) {
                addAssignmentOption.style.visibility = 'visible';
            } else {
                addAssignmentOption.style.visibility = 'hidden'; // 隐藏 Add Assignment 按钮
            }

            // 设置默认勾选 "Unfinished" 选择框
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
            handleCheckboxChange(); // 不再依赖 event 对象

        } else {
            const errorData = await response.json();
            // 用户未登录，隐藏 user-container，显示 login 按钮
            document.querySelector('.user-container').style.display = 'none';
            document.getElementById('login-btn').style.display = 'block';
            alert(`获取用户信息失败: ${errorData.error}`);
            console.error('Failed to fetch user info:', errorData);
            window.location.href = '/login'; // 如果获取用户信息失败，跳转到登录页面
            return;
        }
        // 控制下拉菜单的显示
        const userInfoButton = document.getElementById('user-info');
        const triangle = document.getElementById('triangle');
        const userOptions = document.querySelectorAll('.user-option');
        const logoutOption = document.getElementById('logout-option');

        userInfoButton.addEventListener('click', () => {
            triangle.classList.toggle('rotated');
            userOptions.forEach(option => {
                option.classList.toggle('show');
            });
        });
            // 登出功能
        logoutOption.addEventListener('click', () => {
            // 清除本地存储中的登录信息
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('studentId');
            localStorage.removeItem('role');
            // 跳转到登录页面
            window.location.href = '/login';
        });
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        alert('获取用户信息时发生错误。');
        window.location.href = '/login'; // 如果发生错误，跳转到登录页面
        return;
    }
});

// 修正后的 handleCheckboxChange 函数
function handleCheckboxChange(event) {
    if (isHandlingCheckboxChange) {
        return; // 如果当前已经在处理选项变更，则直接返回
    }
    isHandlingCheckboxChange = true;

    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');

    if (event) {
        const target = event.target;

        if (target.id === 'filter-finished') {
            filterUnfinished.checked = false;
        } else if (target.id === 'filter-unfinished') {
            filterFinished.checked = false;
        }
    } else {
        // 如果没有事件对象，确保至少一个被勾选
        if (filterFinished.checked) {
            filterUnfinished.checked = false;
        } else if (filterUnfinished.checked) {
            filterFinished.checked = false;
        }
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
}

// 重构 handleSubjectCheckboxChange 函数
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

    const role = localStorage.getItem('role');  // 从缓存中获取用户角色

    assignments.forEach(assignment => {
        const assignmentTitle = assignment['assignment-title']; // 定义 assignmentTitle
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

        // 添加 Delete 和 Edit 按钮
        if (['assistant', 'teacher', 'admin'].includes(role)) {
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // Delete 按钮
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';  // 使用自定义样式
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                showDeleteConfirmation(assignmentTitle, assignment['class-id'], assignment['assignment-id']);
            });

            // Edit 按钮
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';  // 使用自定义样式
            editButton.textContent = 'Edit';

            editButton.addEventListener('click', () => {
                // 使用 query 参数传递 assignment_id
                window.location.href = `/edit-assignment?assignment_id=${assignment['assignment-id']}`;
            });

            // 将按钮添加到按钮容器中
            buttonContainer.appendChild(deleteButton);
            buttonContainer.appendChild(editButton);

            // 将按钮容器插入到作业项中
            homeworkItem.querySelector('.homework-status-container').insertAdjacentElement('beforebegin', buttonContainer);
        }
        
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
                    homeworkItem.insertBefore(expandButton.parentElement, fullContent);
                }
            });
        }

        // 添加淡入效果并追加作业到容器中
        container.appendChild(homeworkItem);
        fadeIn(homeworkItem);
    });

    // 修正最后一项作业的高度，防止 Expand 按钮被遮挡
    const lastHomeworkItem = homeworkContainer.lastElementChild;
    if (lastHomeworkItem) {
        lastHomeworkItem.style.marginBottom = '20px';
    }
}

// 弹出第一个确认框
function showDeleteConfirmation(assignmentTitle, classId, assignmentId) {
    const confirmationBox = document.createElement('div');
    confirmationBox.className = 'confirmation-box';
    confirmationBox.innerHTML = `
        <p>Are you sure you would like to delete this assignment? ${assignmentTitle}</p>
        <button class="no-button">No</button>
        <button class="yes-button">Yes</button>
    `;

    document.body.appendChild(confirmationBox);

    // No 按钮取消框
    confirmationBox.querySelector('.no-button').addEventListener('click', () => {
        document.body.removeChild(confirmationBox);
    });

    // Yes 按钮弹出第二个确认框
    confirmationBox.querySelector('.yes-button').addEventListener('click', () => {
        document.body.removeChild(confirmationBox);
        showSecondDeleteConfirmation(assignmentTitle, classId, assignmentId);
    });
}

// 弹出第二个确认框
function showSecondDeleteConfirmation(assignmentTitle, classId, assignmentId) {
    const secondConfirmationBox = document.createElement('div');
    secondConfirmationBox.className = 'confirmation-box';
    secondConfirmationBox.innerHTML = `
        <p>Are you sure you really want to delete this assignment? ${assignmentTitle}</p>
        <button class="yes-button">Yes</button>
        <button class="no-button">No</button>
    `;

    document.body.appendChild(secondConfirmationBox);

    // No 按钮取消框
    secondConfirmationBox.querySelector('.no-button').addEventListener('click', () => {
        document.body.removeChild(secondConfirmationBox);
    });

    // Yes 按钮调用删除作业API
    secondConfirmationBox.querySelector('.yes-button').addEventListener('click', () => {
        document.body.removeChild(secondConfirmationBox);
        deleteAssignment(classId, assignmentId);
    });
}

// 调用删除作业的API
function deleteAssignment(classId, assignmentId) {
    fetch('/delete_assignment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ class_id: classId, assignment_id: assignmentId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);  // 显示删除成功信息

            // 从界面移除被删除的作业项
            const assignmentElements = document.querySelectorAll(`.homework-item[data-class-id="${classId}"][data-assignment-id="${assignmentId}"]`);
            assignmentElements.forEach(el => el.remove());
        } else {
            alert('Failed to delete the assignment');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
