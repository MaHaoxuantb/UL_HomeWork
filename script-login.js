document.addEventListener('DOMContentLoaded', function () {
    // 页面加载时检查是否有缓存的Student ID
    const cachedStudentId = localStorage.getItem('student-id');
    if (cachedStudentId) {
        document.getElementById('student-id').value = cachedStudentId;
    }
});

// 切换密码隐藏/显示功能
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const eyeIcon = togglePasswordButton.querySelector('img');

togglePasswordButton.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    eyeIcon.src = type === 'password' ? 'eye-close.png' : 'eye-open.png';
});

// 示例点击事件
document.getElementById('login-btn').addEventListener('click', function () {
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('password').value;

    hideError(); // 点击登录时，先隐藏错误信息

    if (!studentId && !password) {
        showError('Please enter both Student ID and Password');
    } else if (!studentId) {
        showError('Please enter Student ID');
    } else if (!password) {
        showError('Please enter Password');
    } else {
        /*
        // 模拟登录请求
        fetch('https://<api-gateway-url>/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'student-id': studentId,
                'password': password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Account Error') {
                showError('Account Error');
            } else if (data.message === 'Password Error') {
                showError('Password Error');
            } else if (data.message === 'Success') {
                localStorage.setItem('student-id', studentId);
                window.location.href = 'index.html'; // 登录成功，跳转到 index.html
            }
        })
        .catch(() => {
            showError('An unexpected error occurred');
        });
        */
        if (!studentId && !password) {
            showError('Please enter both Student ID and Password');
        } else if (!studentId) {
            showError('Please enter Student ID');
        } else if (!password) {
            showError('Please enter Password');
        } else if (studentId === '123' && password === '456') {
            // 模拟验证成功，跳转到 index.html
            localStorage.setItem('student-id', studentId);
            window.location.href = 'index.html';
        } else if (studentId !== '123') {
            showError('Account Error');
        } else if (password !== '456') {
            showError('Password Error');
        }
    }
});

// 显示错误信息的函数
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const errorIcon = document.querySelector('.error-icon');

    errorText.textContent = message;
    errorIcon.style.display = 'inline'; // 显示error图标
    errorMessage.style.display = 'flex'; // 显示错误信息框
}

// 隐藏错误信息的函数
function hideError() {
    const errorMessage = document.getElementById('error-message');
    const errorIcon = document.querySelector('.error-icon');
    
    errorMessage.style.display = 'none'; // 隐藏错误信息框
    errorIcon.style.display = 'none'; // 隐藏error图标
}


