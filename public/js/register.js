'use strict';

(function () {
  const form = document.getElementById('registerForm');
  const alertBox = document.getElementById('registerAlert');
  const submitBtn = document.getElementById('registerSubmitBtn');

  function showAlert(type, message) {
    alertBox.className = `alert-banner visible ${type}`;
    alertBox.textContent = message;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const budgetTier = document.getElementById('budgetTier').value;
    const preferredLocation = document.getElementById('preferredLocation').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (fullName.length < 2) {
      return showAlert('error', 'Please enter your full name.');
    }
    if (!email || !email.includes('@')) {
      return showAlert('error', 'Please enter a valid email address.');
    }
    if (password.length < 6) {
      return showAlert('error', 'Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return showAlert('error', 'Passwords do not match. Please verify.');
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Profile...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          role,
          budgetTier,
          preferredLocation,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert('error', data.error || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Member Account <span>&#8600;</span>';
        return;
      }

      showAlert('success', `Welcome to Propvanta, ${data.user.fullName}. Redirecting to Home...`);
      setTimeout(() => {
        window.location.href = '/';
      }, 700);
    } catch {
      showAlert('error', 'Network error during registration. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Member Account <span>&#8600;</span>';
    }
  });
})();
