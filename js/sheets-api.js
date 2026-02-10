// ===== INTEGRACIÓN CON GOOGLE SHEETS =====

class SheetsAPIManager {
    constructor() {
        // IMPORTANTE: Reemplaza estos valores con los tuyos
        this.SHEET_ID = 'TU_SHEET_ID_AQUI'; // ID de tu Google Sheet
        this.API_KEY = 'TU_API_KEY_AQUI'; // API Key de Google
        this.RANGE = 'Citas!A2:F1000'; // Rango de celdas
        this.citas = [];
        
        // Google Apps Script URL (opcional pero recomendado)
        this.APPS_SCRIPT_URL = 'TU_APPS_SCRIPT_URL_AQUI';
        
        this.init();
    }

    init() {
        this.loadCitas();
    }

    // ===== CARGAR CITAS DESDE SHEETS =====
    async loadCitas() {
        try {
            showToast('Cargando citas...', 'info');

            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.RANGE}?key=${this.API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.values) {
                this.citas = this.parseCitas(data.values);
                window.calendarManager?.updateCalendar(this.citas);
                showToast(`${this.citas.length} citas cargadas`, 'success');
                this.updateSyncTime();
            } else {
                this.citas = [];
                window.calendarManager?.updateCalendar([]);
            }
        } catch (error) {
            console.error('Error cargando citas:', error);
            showToast('Error al cargar citas. Verifica tu Sheet ID y API Key.', 'error');
        }
    }

    // ===== PARSEAR DATOS DEL SHEET =====
    parseCitas(values) {
        return values.map((row, index) => ({
            id: `cita_${index}_${Date.now()}`,
            paciente: row[0] || '',
            fecha: row[1] || '',
            hora: row[2] || '',
            duracion: parseInt(row[3]) || 60,
            tipo: row[4] || 'presencial',
            notas: row[5] || '',
            timestamp: Date.now()
        })).filter(cita => cita.paciente && cita.fecha);
    }

    // ===== GUARDAR CITA EN SHEETS =====
    async saveCita(cita) {
        try {
            // Opción 1: Usar Google Apps Script (RECOMENDADO)
            if (this.APPS_SCRIPT_URL) {
                return await this.saveCitaViaAppsScript(cita);
            }

            // Opción 2: Guardar localmente y mostrar instrucciones
            showToast(
                'Cita guardada localmente. Necesitas configurar Google Apps Script para guardar en el Sheet.',
                'info'
            );

            this.citas.push(cita);
            window.calendarManager?.updateCalendar(this.citas);

            return true;
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