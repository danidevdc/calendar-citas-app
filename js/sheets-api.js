// ===== INTEGRACIÓN CON GOOGLE SHEETS =====

class SheetsAPIManager {
    constructor() {
        // ✅ SEGURIDAD: Solo usamos Google Apps Script
        // No se exponen credenciales sensibles en el cliente
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbweTkpP5_01dknzX-LD58t1DYpZyFUBlZFGx67nBPmipDvqhmRR3PPQSkBj3KL9ZQ/exec';
        this.citas = [];
        
        // Verificar que la URL esté configurada
        if (!this.APPS_SCRIPT_URL) {
            console.error('⚠️ Google Apps Script URL no configurada');
        }
        
        this.init();
    }

    init() {
        this.loadCitas();
    }

    // ===== CARGAR CITAS DESDE SHEETS =====
    async loadCitas() {
        try {
            showToast('Cargando citas...', 'info');

            // ✅ Cargar desde Google Apps Script (seguro)
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getCitas`);
            const data = await response.json();

            if (data.success && data.values && data.values.length > 0) {
                // Hay datos reales de Google Sheets
                this.citas = this.parseCitas(data.values);
                window.calendarManager?.updateCalendar(this.citas);
                showToast(`${this.citas.length} citas cargadas`, 'success');
                this.updateSyncTime();
                
                // Limpiar mocks porque hay datos reales
                localStorage.removeItem('calendarMockData');
                localStorage.removeItem('usingMockData');
            } else {
                // No hay datos en Google Sheets
                const usingMocks = localStorage.getItem('usingMockData');
                if (!usingMocks) {
                    // No hay mocks ni datos reales
                    this.citas = [];
                    window.calendarManager?.updateCalendar([]);
                    showToast('No hay citas registradas', 'info');
                } else {
                    // Mantener los mocks
                    showToast('Usando datos de ejemplo', 'info');
                }
                this.updateSyncTime();
            }
        } catch (error) {
            console.error('Error cargando citas:', error);
            showToast('Error al cargar citas. Usando datos locales.', 'error');
        }
    }

    // ===== PARSEAR DATOS DEL SHEET =====
    parseCitas(values) {
        return values.map((row, index) => ({
            id: `cita_${index}_${Date.now()}`,
            paciente: row[0] || '',
            apellido: row[1] || '',
            carrera: row[2] || '',
            fecha: row[3] || '',
            hora: row[4] || '',
            duracion: parseInt(row[5]) || 45,
            tipo: row[6] || 'presencial',
            notas: row[7] || '',
            timestamp: Date.now()
        })).filter(cita => cita.paciente && cita.fecha);
    }

    // ===== GUARDAR CITA EN SHEETS =====
    async saveCita(cita) {
        try {
            // ✅ Solo usar Google Apps Script (seguro)
            return await this.saveCitaViaAppsScript(cita);
        } catch (error) {
            console.error('Error guardando cita:', error);
            showToast('Error al guardar la cita', 'error');
            return false;
        }
    }

    // ===== GUARDAR VÍA GOOGLE APPS SCRIPT =====
    async saveCitaViaAppsScript(cita) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveCita',
                    cita: {
                        paciente: cita.paciente,
                        apellido: cita.apellido || '',
                        carrera: cita.carrera || '',
                        fecha: cita.fecha,
                        hora: cita.hora,
                        duracion: cita.duracion,
                        tipo: cita.tipo,
                        notas: cita.notas
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                this.citas.push(cita);
                window.calendarManager?.updateCalendar(this.citas);
                showToast('Cita guardada correctamente', 'success');
                
                // Limpiar mocks al guardar datos reales
                localStorage.removeItem('calendarMockData');
                localStorage.removeItem('usingMockData');
                
                // Celebrar con confetti
                if (typeof window.celebrateSuccess === 'function') {
                    window.celebrateSuccess();
                }
                
                return true;
            } else {
                showToast('Error al guardar: ' + (data.error || 'Desconocido'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con Google Apps Script', 'error');
            return false;
        }
    }

    // ===== ELIMINAR CITA =====
    async deleteCita(citaId) {
        try {
            this.citas = this.citas.filter(c => c.id !== citaId);
            window.calendarManager?.updateCalendar(this.citas);
            showToast('Cita eliminada', 'success');
            return true;
        } catch (error) {
            console.error('Error eliminando cita:', error);
            showToast('Error al eliminar la cita', 'error');
            return false;
        }
    }

    // ===== ACTUALIZAR TIEMPO DE SINCRONIZACIÓN =====
    updateSyncTime() {
        const syncText = document.getElementById('syncText');
        if (syncText) {
            const now = new Date();
            syncText.textContent = `Último sincronizado: ${now.toLocaleTimeString('es-ES')}`;
        }
    }

    // ===== RECARGAR CITAS CADA 5 MINUTOS =====
    autoSync(intervalMinutes = 5) {
        setInterval(() => {
            this.loadCitas();
        }, intervalMinutes * 60 * 1000);
    }
}

// Inicializar API
const sheetsAPI = new SheetsAPIManager();