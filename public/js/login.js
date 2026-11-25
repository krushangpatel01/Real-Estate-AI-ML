'use strict';

(function () {
  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const fillDemoBtn = document.getElementById('fillDemoBtn');

  function showAlert(type, message) {
    alertBox.className = `alert-banner visible ${type}`;
    alertBox.textContent = message;
  }

  async function submitLogin(email, password, rememberMe) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Credentials...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert('error', data.error || 'Unable to sign in.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to Portfolio <span>&#8600;</span>';
        return;
      }

      showAlert('success', `Welcome back, ${data.user.fullName}. Redirecting to your portfolio...`);
      setTimeout(() => {
        window.location.href = '/';
      }, 650);
    } catch (err) {
      showAlert('error', 'Network error while signing in. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In to Portfolio <span>&#8600;</span>';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
      showAlert('error', 'Please enter both your email address and password.');
      return;
    }

    submitLogin(email, password, rememberMe);
  });

  fillDemoBtn.addEventListener('click', () => {
    document.getElementById('email').value = 'demo@propvanta.ai';
    document.getElementById('password').value = 'Propvanta@2026';
    submitLogin('demo@propvanta.ai', 'Propvanta@2026', true);
  });
})();
