// ===== SISTEMA DE AUTENTICACIÓN =====

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.storageKey = 'cita_auth_token';
        this.passwordHashKey = 'cita_password_hash';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const passwordInput = document.getElementById('passwordInput');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });

            // Auto-focus en el input
            setTimeout(() => passwordInput.focus(), 200);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    // ===== HASH SIMPLE DE CONTRASEÑA =====
    // Nota: Para producción, considera usar una librería como bcryptjs
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    handleLogin() {
        const passwordInput = document.getElementById('passwordInput');
        const errorMsg = document.getElementById('errorMsg');
        const password = passwordInput.value.trim();

        if (!password) {
            this.showError('Por favor ingresa una contraseña', errorMsg);
            return;
        }

        // Obtener contraseña guardada (si no existe, establecer la primera que ingresan)
        let storedHash = localStorage.getItem(this.passwordHashKey);
        
        if (!storedHash) {
            // Primera vez: guardar el hash de la contraseña
            storedHash = this.hashPassword(password);
            localStorage.setItem(this.passwordHashKey, storedHash);
            this.showSuccess('Contraseña establecida. ¡Bienvenido!');
        }

        const inputHash = this.hashPassword(password);

        if (inputHash !== storedHash) {
            this.showError('Contraseña incorrecta', errorMsg);
            passwordInput.classList.add('shake');
            setTimeout(() => passwordInput.classList.remove('shake'), 500);
            return;
        }

        // Contraseña correcta
        this.authenticate();
    }

    authenticate() {
        this.isAuthenticated = true;
        const token = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(this.storageKey, token);

        // Ocultar modal y mostrar app
        const authModal = document.getElementById('authModal');
        const appContainer = document.getElementById('appContainer');

        authModal.classList.remove('active');
        appContainer.classList.add('visible');

        // Inicializar app
        setTimeout(() => {
            if (window.calendarManager) {
                window.calendarManager.init();
            }
            if (window.sheetsAPI) {
                window.sheetsAPI.loadCitas();
            }
        }, 300);
    }

    checkAuth() {
        const token = localStorage.getItem(this.storageKey);
        if (token) {
            this.isAuthenticated = true;
            const authModal = document.getElementById('authModal');
            const appContainer = document.getElementById('appContainer');
            authModal.classList.remove('active');
            appContainer.classList.add('visible');
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.storageKey);
            location.reload();
        }
    }

    showError(message, element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
    }

    showSuccess(message) {
        showToast(message, 'success');
    }
}

// ===== UTILIDAD PARA TOAST =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Inicializar auth manager
const authManager = new AuthManager();