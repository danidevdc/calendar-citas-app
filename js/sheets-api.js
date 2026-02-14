// ===== INTEGRACIÓN CON GOOGLE SHEETS =====

class SheetsAPIManager {
    constructor() {
        // ✅ SEGURIDAD: Solo usamos Google Apps Script
        // No se exponen credenciales sensibles en el cliente
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwTlwMyqmV59O2u74qD1Is0vYTkG2AWPEu10mJ2JHWMGh5-jp9u8bB_rcEbSEJ5SNoQA/exec';
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
            console.log('📥 Cargando citas desde Google Sheets...');

            // ✅ Cargar desde Google Apps Script (seguro)
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getCitas`, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.values && data.values.length > 0) {
                // ✅ Hay datos reales de Google Sheets
                this.citas = this.parseCitas(data.values);
                
                // Limpiar mocks porque hay datos reales
                localStorage.removeItem('calendarMockData');
                localStorage.removeItem('usingMockData');
                
                window.calendarManager?.updateCalendar(this.citas);
                console.log(`✅ ${this.citas.length} citas cargadas desde Sheets`);
                showToast(`${this.citas.length} citas cargadas`, 'success');
                this.updateSyncTime();
            } else {
                // ⚠️ No hay datos en Google Sheets
                console.log('⚠️ No hay datos en Google Sheets');
                
                // Intentar cargar mocks si existen, o crearlos
                const mockLoaded = window.calendarManager?.loadMockDataIfNeeded();
                
                if (mockLoaded) {
                    showToast('Usando datos de ejemplo', 'info');
                } else {
                    // No hay nada
                    this.citas = [];
                    window.calendarManager?.updateCalendar([]);
                    console.log('📭 Sin citas registradas');
                    showToast('No hay citas registradas', 'info');
                }
                this.updateSyncTime();
            }
        } catch (error) {
            console.error('❌ Error cargando citas:', error);
            showToast(`Error: ${error.message}`, 'error');
            
            // Intentar cargar datos locales como respaldo
            const mockLoaded = window.calendarManager?.loadMockDataIfNeeded();
            if (mockLoaded) {
                console.log('📋 Usando datos locales como respaldo');
            }
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
            // ✅ Enviar cada campo como parámetro individual (más compatible)
            const params = new URLSearchParams({
                action: 'saveCita',
                paciente: cita.paciente || '',
                apellido: cita.apellido || '',
                carrera: cita.carrera || '',
                fecha: cita.fecha || '',
                hora: cita.hora || '',
                duracion: cita.duracion || 45,
                tipo: cita.tipo || 'presencial',
                notas: cita.notas || ''
            });

            const url = `${this.APPS_SCRIPT_URL}?${params.toString()}`;
            
            console.log('📤 Enviando cita a Google Sheets...');
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📩 Respuesta de Google:', data);

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
            console.error('❌ Error guardando cita:', error);
            showToast(`Error: ${error.message}`, 'error');
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