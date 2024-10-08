document.getElementById('submit-btn').addEventListener('click', function () {
    const previousPassword = document.getElementById('previous-password').value;
    const updatedPassword = document.getElementById('updated-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 清空错误信息
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('error-text').innerText = '';
    document.querySelector('.error-icon').style.display = 'none'; // 隐藏错误图标

    if (updatedPassword !== confirmPassword) {
        // 如果新密码和确认密码不匹配，显示错误信息
        document.getElementById('error-text').innerText = 'Your Updated Passwords are NOT the same.';
        document.getElementById('error-message').style.display = 'flex';
        document.querySelector('.error-icon').style.display = 'block'; // 显示错误图标
        return;
    }

    // 发送API请求
    fetch('/change_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
        },
        body: JSON.stringify({
            old_password: previousPassword,
            new_password: updatedPassword
        })
    }).then(response => response.json()).then(data => {
        if (data.error) {
            document.getElementById('error-text').innerText = data.error;
            document.getElementById('error-message').style.display = 'flex';
            document.querySelector('.error-icon').style.display = 'block'; // 显示错误图标
        } else {
            alert('Password changed successfully!');
            window.location.href = '/'; // 可根据需要跳转到其他页面
        }
    }).catch(error => {
        document.getElementById('error-text').innerText = 'An error occurred. Please try again.';
        document.getElementById('error-message').style.display = 'flex';
        document.querySelector('.error-icon').style.display = 'block'; // 显示错误图标
    });
});

// 密码可见性切换
function togglePasswordVisibility(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    button.addEventListener('click', function () {
        if (input.type === 'password') {
            input.type = 'text';
            button.querySelector('img').src = '../static/eye-open.png';
        } else {
            input.type = 'password';
            button.querySelector('img').src = '../static/eye-close.png';
        }
    });
}

togglePasswordVisibility('toggle-previous-password', 'previous-password');
togglePasswordVisibility('toggle-updated-password', 'updated-password');
togglePasswordVisibility('toggle-confirm-password', 'confirm-password');
