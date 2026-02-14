// ===== INTEGRACIÓN CON GOOGLE SHEETS =====

class SheetsAPIManager {
    constructor() {
        // ✅ SEGURIDAD: Solo usamos Google Apps Script
        // No se exponen credenciales sensibles en el cliente
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwo3tk97YuKd11ojUyGi9iMlJqRJmP9NRvGjWsKxlbbkHiLBsHn_PxGnQn_qNcLhEZH1w/exec';
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
        const citas = values.map((row, index) => ({
            id: `cita_${index}_${Date.now()}`,
            paciente: row[0] || '',
            apellido: row[1] || '',
            carrera: row[2] || '',
            fecha: row[3] || '',
            hora: row[4] || '',
            duracion: parseInt(row[5]) || 45,
            estado: row[6] || 'pendiente',  // Columna G ahora es "Estado"
            notas: row[7] || '',
            timestamp: Date.now()
        }));

        // ✅ Filtrar citas con datos válidos y fechas/horas correctas
        const citasValidas = citas.filter(cita => {
            // Debe tener al menos paciente y fecha
            if (!cita.paciente || !cita.fecha || !cita.hora) {
                return false;
            }

            // Validar formato de fecha (YYYY-MM-DD)
            const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!fechaRegex.test(cita.fecha)) {
                console.warn(`⚠️ Fecha inválida ignorada: ${cita.fecha}`);
                return false;
            }

            // Validar formato de hora (HH:MM)
            const horaRegex = /^\d{1,2}:\d{2}$/;
            if (!horaRegex.test(cita.hora)) {
                console.warn(`⚠️ Hora inválida ignorada: ${cita.hora}`);
                return false;
            }

            // Validar que la fecha sea válida (no NaN)
            const [year, month, day] = cita.fecha.split('-').map(Number);
            const [hour, minute] = cita.hora.split(':').map(Number);
            const testDate = new Date(year, month - 1, day, hour, minute);
            
            if (isNaN(testDate.getTime())) {
                console.warn(`⚠️ Fecha/hora inválida ignorada: ${cita.fecha} ${cita.hora}`);
                return false;
            }

            return true;
        });

        console.log(`✅ ${citasValidas.length} citas válidas de ${citas.length} filas`);
        return citasValidas;
    }

    // ===== GUARDAR CITA EN SHEETS =====
    async saveCita(cita, isEditing = false) {
        try {
            if (isEditing) {
                // 🔄 Si es edición, actualizar solo localmente
                // (Google Sheets no soporta edición fácil de filas específicas)
                console.log('✏️ Editando cita localmente...');
                
                const index = this.citas.findIndex(c => c.id === cita.id);
                if (index !== -1) {
                    this.citas[index] = cita;
                    window.calendarManager?.updateCalendar(this.citas);
                    showToast('✅ Cita actualizada (solo local)', 'success');
                    
                    if (typeof window.celebrateSuccess === 'function') {
                        window.celebrateSuccess();
                    }
                    
                    return true;
                } else {
                    showToast('⚠️ No se encontró la cita para editar', 'error');
                    return false;
                }
            } else {
                // ➕ Nueva cita - guardar en Google Sheets
                return await this.saveCitaViaAppsScript(cita);
            }
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
                estado: cita.estado || 'pendiente',
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
                showToast('✅ Cita guardada en Google Sheets', 'success');
                
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
            // Buscar la cita a eliminar
            const cita = this.citas.find(c => c.id === citaId);
            if (!cita) {
                showToast('⚠️ Cita no encontrada', 'error');
                return false;
            }

            console.log('🗑️ Eliminando cita de Google Sheets...');

            // Enviar petición de eliminación a Google Apps Script
            const params = new URLSearchParams({
                action: 'deleteCita',
                paciente: cita.paciente,
                fecha: cita.fecha,
                hora: cita.hora
            });

            const url = `${this.APPS_SCRIPT_URL}?${params.toString()}`;
            
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
                // Eliminar localmente también
                this.citas = this.citas.filter(c => c.id !== citaId);
                window.calendarManager?.updateCalendar(this.citas);
                showToast('✅ Cita eliminada de Google Sheets', 'success');
                return true;
            } else {
                showToast('⚠️ ' + (data.error || 'Error al eliminar'), 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Error eliminando cita:', error);
            showToast(`Error: ${error.message}`, 'error');
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