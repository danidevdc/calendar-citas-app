// ===== CONFIGURACIÓN DE DÍAS FERIADOS =====

/**
 * Sistema de gestión de días feriados
 * Los feriados se almacenan en localStorage para persistencia
 */

class HolidaysManager {
    constructor() {
        this.holidays = [];
        this.loadFromLocalStorage();
        this.initDefaultHolidays();
    }

    // ===== CARGAR DESDE LOCALSTORAGE =====
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('holidays');
            if (stored) {
                this.holidays = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error cargando feriados:', error);
            this.holidays = [];
        }
    }

    // ===== GUARDAR EN LOCALSTORAGE =====
    saveToLocalStorage() {
        try {
            localStorage.setItem('holidays', JSON.stringify(this.holidays));
        } catch (error) {
            console.error('Error guardando feriados:', error);
        }
    }

    // ===== INICIALIZAR FERIADOS POR DEFECTO =====
    initDefaultHolidays() {
        // Solo agregar defaults si no hay ninguno guardado
        if (this.holidays.length === 0) {
            this.holidays = [
                { date: '01-01', name: 'Año Nuevo', recurring: true },
                { date: '05-01', name: 'Día del Trabajo', recurring: true },
                { date: '12-25', name: 'Navidad', recurring: true }
            ];
            this.saveToLocalStorage();
        }
    }

    // ===== AGREGAR FERIADO =====
    addHoliday(date, name, recurring = false) {
        // Formato: YYYY-MM-DD o MM-DD
        const dateStr = recurring ? date.substring(5) : date; // "2026-12-25" -> "12-25"
        
        // Verificar si ya existe
        const exists = this.holidays.some(h => h.date === dateStr);
        if (exists) {
            return { success: false, message: 'Este feriado ya existe' };
        }

        this.holidays.push({
            date: dateStr,
            name: name,
            recurring: recurring
        });

        this.saveToLocalStorage();
        return { success: true, message: 'Feriado agregado' };
    }

    // ===== ELIMINAR FERIADO =====
    removeHoliday(date) {
        const initialLength = this.holidays.length;
        this.holidays = this.holidays.filter(h => h.date !== date);
        
        if (this.holidays.length < initialLength) {
            this.saveToLocalStorage();
            return { success: true, message: 'Feriado eliminado' };
        }
        
        return { success: false, message: 'Feriado no encontrado' };
    }

    // ===== OBTENER TODOS LOS FERIADOS =====
    getAllHolidays() {
        return [...this.holidays]; // Retornar copia
    }

    // ===== VERIFICAR SI UNA FECHA ES FERIADO =====
    isHoliday(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const fullDate = `${year}-${month}-${day}`;
        const shortDate = `${month}-${day}`;
        
        return this.holidays.some(h => h.date === fullDate || h.date === shortDate);
    }

    // ===== OBTENER NOMBRE DEL FERIADO =====
    getHolidayName(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        
        const fullDate = `${year}-${month}-${day}`;
        const shortDate = `${month}-${day}`;
        
        const holiday = this.holidays.find(h => h.date === fullDate || h.date === shortDate);
        return holiday ? holiday.name : 'Día Feriado';
    }
}

// ===== INSTANCIAR MANAGER GLOBAL =====
const holidaysManager = new HolidaysManager();

// ===== FUNCIONES COMPATIBLES CON CÓDIGO EXISTENTE =====
function isHoliday(date) {
    return holidaysManager.isHoliday(date);
}

function getHolidayName(date) {
    return holidaysManager.getHolidayName(date);
}

// ===== UI DE GESTIÓN DE FERIADOS =====
function initHolidaysUI() {
    const configBtn = document.getElementById('configHolidaysBtn');
    const modal = document.getElementById('holidaysModal');
    const closeBtn = document.getElementById('closeHolidaysBtn');
    const closeModalBtn = document.getElementById('closeHolidaysModalBtn');
    const addBtn = document.getElementById('addHolidayBtn');
    
    if (!modal) return;

    // Abrir modal
    configBtn?.addEventListener('click', () => {
        modal.classList.add('active');
        renderHolidaysList();
    });

    // Cerrar modal
    const closeModal = () => modal.classList.remove('active');
    closeBtn?.addEventListener('click', closeModal);
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Agregar feriado
    addBtn?.addEventListener('click', () => {
        const dateInput = document.getElementById('holidayDate');
        const nameInput = document.getElementById('holidayName');
        const recurringInput = document.getElementById('holidayRecurring');

        const date = dateInput.value;
        const name = nameInput.value.trim();
        const recurring = recurringInput.checked;

        if (!date || !name) {
            showToast('Por favor completa todos los campos', 'error');
            return;
        }

        const result = holidaysManager.addHoliday(date, name, recurring);
        
        if (result.success) {
            showToast('✅ ' + result.message, 'success');
            dateInput.value = '';
            nameInput.value = '';
            recurringInput.checked = false;
            renderHolidaysList();
            
            // Actualizar calendario si existe
            if (window.calendarManager) {
                window.calendarManager.calendar.refetchEvents();
            }
        } else {
            showToast('⚠️ ' + result.message, 'error');
        }
    });
}

// ===== RENDERIZAR LISTA DE FERIADOS =====
function renderHolidaysList() {
    const container = document.getElementById('holidaysList');
    if (!container) return;

    const holidays = holidaysManager.getAllHolidays();

    if (holidays.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay feriados configurados</p>';
        return;
    }

    // Ordenar por fecha
    holidays.sort((a, b) => {
        const [aMonth, aDay] = a.date.split('-').map(Number);
        const [bMonth, bDay] = b.date.split('-').map(Number);
        return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
    });

    container.innerHTML = holidays.map(holiday => `
        <div class="holiday-item">
            <div class="holiday-info">
                <span class="holiday-date">📅 ${formatHolidayDate(holiday.date)}</span>
                <span class="holiday-name">${holiday.name}</span>
                ${holiday.recurring ? '<span class="holiday-badge">🔄 Anual</span>' : '<span class="holiday-badge">📆 Único</span>'}
            </div>
            <button class="btn-delete-holiday" onclick="deleteHoliday('${holiday.date}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// ===== FORMATEAR FECHA PARA DISPLAY =====
function formatHolidayDate(dateStr) {
    const [month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(month) - 1]}`;
}

// ===== ELIMINAR FERIADO =====
function deleteHoliday(date) {
    if (confirm('¿Eliminar este feriado?')) {
        const result = holidaysManager.removeHoliday(date);
        
        if (result.success) {
            showToast('🗑️ ' + result.message, 'success');
            renderHolidaysList();
            
            // Actualizar calendario
            if (window.calendarManager) {
                window.calendarManager.calendar.refetchEvents();
            }
        } else {
            showToast('⚠️ ' + result.message, 'error');
        }
    }
}

// ===== INICIALIZAR AL CARGAR =====
window.addEventListener('DOMContentLoaded', () => {
    initHolidaysUI();
    console.log('✅ Sistema de feriados inicializado');
});
