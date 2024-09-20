document.addEventListener('DOMContentLoaded', function () {
    const homeworkItems = document.querySelectorAll('.homework-item');
    const filterFinished = document.getElementById('filter-finished');
    const filterUnfinished = document.getElementById('filter-unfinished');
    const filterSubjects = document.querySelectorAll('.category input[type="checkbox"]:not(#filter-finished, #filter-unfinished)');

    // 初始排序：根据截止日期
    function sortHomework() {
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
        const showFinished = filterFinished.checked;
        const showUnfinished = filterUnfinished.checked;

        homeworkItems.forEach(item => {
            const isFinished = item.querySelector('.homework-status').checked;

            if (showFinished && !isFinished) {
                item.style.display = 'none';
            } else if (showUnfinished && isFinished) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });
        sortHomework();
    }

    // 根据科目进行过滤
    function filterBySubject() {
        const selectedSubjects = Array.from(filterSubjects)
            .filter(subject => subject.checked)
            .map(subject => subject.id.replace('filter-', ''));

        homeworkItems.forEach(item => {
            const subject = item.getAttribute('data-subject').toLowerCase();
            if (selectedSubjects.length === 0 || selectedSubjects.includes(subject)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        sortHomework();
    }

    // 监听状态过滤器
    filterFinished.addEventListener('change', filterByStatus);
    filterUnfinished.addEventListener('change', filterByStatus);

    // 监听科目过滤器
    filterSubjects.forEach(subjectFilter => {
        subjectFilter.addEventListener('change', filterBySubject);
    });

    // 用户点击 Finished 按钮，切换作业完成状态
    homeworkItems.forEach(item => {
        item.querySelector('.homework-status').addEventListener('change', filterByStatus);
    });

    // 初始排序
    sortHomework();

    // 展开/收起功能
    homeworkItems.forEach(item => {
        const expandLink = item.querySelector('.expand a');
        const details = item.querySelector('.details');
        const ulItems = item.querySelectorAll('ul li');
        
        // 默认只显示前三项作业
        ulItems.forEach((li, index) => {
            if (index >= 3) li.style.display = 'none';
        });

        // 展开/收起作业项
        expandLink.addEventListener('click', function (e) {
            e.preventDefault();
            const isExpanded = details.classList.contains('expanded');

            // 切换展开/收起
            if (isExpanded) {
                details.style.maxHeight = '0px';
                ulItems.forEach((li, index) => {
                    if (index >= 3) li.style.display = 'none';
                });
                details.classList.remove('expanded');
                expandLink.textContent = 'Expand';
            } else {
                details.style.maxHeight = details.scrollHeight + 'px';
                ulItems.forEach(li => li.style.display = '');
                details.classList.add('expanded');
                expandLink.textContent = 'Collapse';
            }
        });
    });
});

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
    document.body.style.filter = 'blur(5px)'; // 虚化index页面
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
    document.body.style.filter = 'none'; // 取消虚化
}

// Light/Dark模式切换
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');

// 获取所有需要变换颜色的透明框
const boxes = document.querySelectorAll('.modal-content, .transparent-box');

modeToggle.addEventListener('change', function () {
    if (modeToggle.checked) {
        // Dark Mode
        modeLabel.textContent = 'Dark Mode';
        boxes.forEach(box => {
            box.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // 黑色透明框
            box.style.color = 'white'; // 白色文字
        });
    } else {
        // Light Mode
        modeLabel.textContent = 'Light Mode';
        boxes.forEach(box => {
            box.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // 白色透明框
            box.style.color = 'black'; // 黑色文字
        });
    }
});
