document.addEventListener('DOMContentLoaded', function () {
    // 页面加载时检查是否有缓存的 Student ID
    const cachedStudentId = localStorage.getItem('studentId'); // 确保使用一致的键名
    if (cachedStudentId) {
        document.getElementById('student-id').value = cachedStudentId;
    }

    // 登录按钮点击事件
    document.getElementById('login-btn').addEventListener('click', async () => {
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
            try {
                const response = await fetch('http://127.0.0.1:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: studentId,
                        password: password
                    })
                });

                const data = await response.json();
                if (data.access_token) {
                    const token = data.access_token;  // 保存 JWT 令牌
                    
                    // 保存 studentId, jwtToken 和 role
                    localStorage.setItem('studentId', studentId);
                    localStorage.setItem('jwtToken', token);
                    
                    // 触发登录成功事件
                    window.dispatchEvent(new CustomEvent('loginSuccess', { detail: { studentId } }));
                    window.location.href = '/'; // 登录成功后跳转
                } else {
                    showError('Login failed');
                }                
            } catch (error) {
                console.error('Error:', error);
                showError('An error occurred while logging in');
            }
        }
    });

    // 切换密码隐藏/显示功能
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('toggle-password');
    const eyeIcon = togglePasswordButton.querySelector('img');

    togglePasswordButton.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eyeIcon.src = type === 'password' ? '../static/eye-close.png' : '../static/eye-open.png';
    });
});

// 显示错误信息的函数
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const errorIcon = document.querySelector('.error-icon');

    errorText.textContent = message;
    errorIcon.style.display = 'inline'; // 显示 error 图标
    errorMessage.style.display = 'flex'; // 显示错误信息框
}

// 隐藏错误信息的函数
function hideError() {
    const errorMessage = document.getElementById('error-message');
    const errorIcon = document.querySelector('.error-icon');

    errorMessage.style.display = 'none'; // 隐藏错误信息框
    errorIcon.style.display = 'none'; // 隐藏 error 图标
}
