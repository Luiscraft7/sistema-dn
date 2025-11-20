// login.js - Lógica del Login
// API se carga globalmente desde api.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('error');
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  // Si ya está logueado, redirigir al dashboard
  if (API.checkAuth()) {
    window.location.href = '/dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validaciones básicas
    if (!username || !password) {
      showError('Por favor ingresa usuario y contraseña');
      return;
    }

    // Deshabilitar botón durante la petición
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';
    errorDiv.style.display = 'none';

    try {
      const response = await API.auth.login(username, password);
      
      if (response.token) {
        // Login exitoso
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirigir al dashboard
        window.location.href = '/dashboard.html';
      } else {
        showError('Error al iniciar sesión');
      }
    } catch (error) {
      showError(error.message || 'Usuario o contraseña incorrectos');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
  });

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Shake animation
    errorDiv.style.animation = 'shake 0.5s';
    setTimeout(() => {
      errorDiv.style.animation = '';
    }, 500);
  }

  // Enter en los inputs
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });

  // Limpiar error al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      if (errorDiv.style.display === 'block') {
        errorDiv.style.display = 'none';
      }
    });
  });

  // Focus automático en username
  usernameInput.focus();
});
