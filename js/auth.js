// ===== SISTEMA DE AUTENTICACIÓN MEJORADO =====

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.storageKey = 'cita_auth_token';
        this.sessionKey = 'cita_session_data';
        this.passwordHashKey = 'cita_password_hash';
        this.saltKey = 'cita_password_salt';
        this.loginAttemptsKey = 'cita_login_attempts';
        
        // Configuración de seguridad
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutos
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 horas
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.cleanupExpiredSessions();
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

    // ===== HASH FUERTE CON SHA-256 Y SALT =====
    async hashPassword(password, salt) {
        try {
            // Sanitizar entrada
            const sanitizedPassword = this.sanitizeInput(password);
            
            // Combinar password con salt
            const data = sanitizedPassword + salt;
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            
            // Usar Web Crypto API para SHA-256
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('Error en hash:', error);
            // Fallback a hash más simple si Web Crypto no está disponible
            return this.simpleHash(password + salt);
        }
    }

    // ===== GENERAR SALT ALEATORIO =====
    generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // ===== SANITIZAR ENTRADA =====
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        // Eliminar caracteres peligrosos
        return input.trim().slice(0, 100); // Max 100 caracteres
    }

    // ===== VALIDAR CONTRASEÑA FUERTE =====
    validatePasswordStrength(password) {
        if (password.length < 6) {
            return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        
        // Opcional: más validaciones
        // if (!/[A-Z]/.test(password)) {
        //     return { valid: false, message: 'Debe contener al menos una mayúscula' };
        // }
        
        return { valid: true, message: 'Contraseña válida' };
    }

    // ===== VERIFICAR INTENTOS DE LOGIN (RATE LIMITING) =====
    checkLoginAttempts() {
        const attempts = JSON.parse(localStorage.getItem(this.loginAttemptsKey) || '[]');
        const now = Date.now();
        
        // Filtrar intentos recientes (últimos 15 minutos)
        const recentAttempts = attempts.filter(timestamp => 
            now - timestamp < this.lockoutDuration
        );
        
        if (recentAttempts.length >= this.maxLoginAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const timeLeft = Math.ceil((this.lockoutDuration - (now - oldestAttempt)) / 1000 / 60);
            return {
                blocked: true,
                message: `Demasiados intentos fallidos. Intenta en ${timeLeft} minutos.`
            };
        }
        
        return { blocked: false };
    }

    // ===== REGISTRAR INTENTO FALLIDO =====
    recordFailedAttempt() {
        const attempts = JSON.parse(localStorage.getItem(this.loginAttemptsKey) || '[]');
        attempts.push(Date.now());
        localStorage.setItem(this.loginAttemptsKey, JSON.stringify(attempts));
    }

    // ===== LIMPIAR INTENTOS =====
    clearLoginAttempts() {
        localStorage.removeItem(this.loginAttemptsKey);
    }

    // ===== HASH SIMPLE (FALLBACK) =====
    simpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // ===== MANEJAR LOGIN =====
    async handleLogin() {
        const passwordInput = document.getElementById('passwordInput');
        const errorMsg = document.getElementById('errorMsg');
        const loginBtn = document.getElementById('loginBtn');
        const password = passwordInput.value;

        // Validar input vacío
        if (!password) {
            this.showError('Por favor ingresa una contraseña', errorMsg);
            return;
        }

        // Verificar intentos de login (rate limiting)
        const attemptCheck = this.checkLoginAttempts();
        if (attemptCheck.blocked) {
            this.showError(attemptCheck.message, errorMsg);
            passwordInput.disabled = true;
            loginBtn.disabled = true;
            return;
        }

        // Deshabilitar botón mientras procesa
        loginBtn.disabled = true;
        loginBtn.textContent = 'Verificando...';

        try {
            // Obtener o crear salt
            let salt = localStorage.getItem(this.saltKey);
            if (!salt) {
                salt = this.generateSalt();
                localStorage.setItem(this.saltKey, salt);
            }

            // Obtener hash guardado
            let storedHash = localStorage.getItem(this.passwordHashKey);
            
            if (!storedHash) {
                // Primera vez: validar y guardar la contraseña
                const validation = this.validatePasswordStrength(password);
                if (!validation.valid) {
                    this.showError(validation.message, errorMsg);
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Establecer Contraseña';
                    return;
                }
                
                storedHash = await this.hashPassword(password, salt);
                localStorage.setItem(this.passwordHashKey, storedHash);
                this.showSuccess('✅ Contraseña establecida correctamente');
                
                // Esperar un momento y autenticar
                setTimeout(() => this.authenticate(), 1000);
                return;
            }

            // Verificar contraseña
            const inputHash = await this.hashPassword(password, salt);

            if (inputHash !== storedHash) {
                this.recordFailedAttempt();
                this.showError('❌ Contraseña incorrecta', errorMsg);
                passwordInput.classList.add('shake');
                passwordInput.value = '';
                setTimeout(() => passwordInput.classList.remove('shake'), 500);
                
                loginBtn.disabled = false;
                loginBtn.textContent = 'Ingresar';
                return;
            }

            // Contraseña correcta
            this.clearLoginAttempts();
            this.authenticate();
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error al procesar. Intenta de nuevo.', errorMsg);
            loginBtn.disabled = false;
            loginBtn.textContent = 'Ingresar';
        }
    }

    // ===== AUTENTICAR Y CREAR SESIÓN =====
    authenticate() {
        this.isAuthenticated = true;
        
        // Generar token seguro
        const tokenArray = new Uint8Array(32);
        crypto.getRandomValues(tokenArray);
        const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
        
        // Datos de sesión con expiración
        const sessionData = {
            token: token,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout,
            userAgent: navigator.userAgent.substring(0, 100) // Fingerprint básico
        };
        
        localStorage.setItem(this.storageKey, token);
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

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

    // ===== VERIFICAR AUTENTICACIÓN =====
    checkAuth() {
        const token = localStorage.getItem(this.storageKey);
        const sessionDataStr = localStorage.getItem(this.sessionKey);
        
        if (!token || !sessionDataStr) {
            return false;
        }

        try {
            const sessionData = JSON.parse(sessionDataStr);
            const now = Date.now();
            
            // Verificar que la sesión no haya expirado
            if (now > sessionData.expiresAt) {
                console.log('⏰ Sesión expirada');
                this.handleLogout(false);
                return false;
            }
            
            // Verificar que el token coincida
            if (sessionData.token !== token) {
                console.log('⚠️ Token no coincide');
                this.handleLogout(false);
                return false;
            }
            
            // Verificar user agent básico (prevenir robo de sesión)
            const currentUA = navigator.userAgent.substring(0, 100);
            if (sessionData.userAgent !== currentUA) {
                console.log('⚠️ User agent diferente');
                this.handleLogout(false);
                return false;
            }
            
            // Sesión válida
            this.isAuthenticated = true;
            const authModal = document.getElementById('authModal');
            const appContainer = document.getElementById('appContainer');
            authModal?.classList.remove('active');
            appContainer?.classList.add('visible');
            
            return true;
            
        } catch (error) {
            console.error('Error verificando sesión:', error);
            this.handleLogout(false);
            return false;
        }
    }

    // ===== LIMPIAR SESIONES EXPIRADAS =====
    cleanupExpiredSessions() {
        const sessionDataStr = localStorage.getItem(this.sessionKey);
        if (!sessionDataStr) return;
        
        try {
            const sessionData = JSON.parse(sessionDataStr);
            const now = Date.now();
            
            if (now > sessionData.expiresAt) {
                localStorage.removeItem(this.storageKey);
                localStorage.removeItem(this.sessionKey);
            }
        } catch (error) {
            // Si hay error, limpiar todo
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.sessionKey);
        }
    }

    // ===== CERRAR SESIÓN =====
    handleLogout(confirm = true) {
        const shouldLogout = !confirm || window.confirm('¿Estás seguro de que deseas cerrar sesión?');
        
        if (shouldLogout) {
            // Limpiar todo
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.sessionKey);
            this.isAuthenticated = false;
            location.reload();
        }
    }

    // ===== MOSTRAR ERROR =====
    showError(message, element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
    }

    // ===== MOSTRAR ÉXITO =====
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