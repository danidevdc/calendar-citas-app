// ===== CONFIGURACIÓN DE DÍAS FERIADOS =====

/**
 * Lista de días feriados
 * Formato: 'YYYY-MM-DD' o 'MM-DD' (se repite cada año)
 * 
 * Agrega aquí las fechas de días feriados que desees marcar en el calendario.
 * Puedes usar formato completo (YYYY-MM-DD) para fechas específicas de un año
 * o formato corto (MM-DD) para fechas que se repiten anualmente.
 */

const HOLIDAYS = [
    // Año Nuevo
    '01-01',
  
    // Día del Trabajo
    '05-01',
    
    // Navidad
    '12-25',
    // Ejemplos de fechas específicas (descomenta para usar):
    '02-16', 
    // Ejemplo: Fecha específica
    '02-17', 
    // Ejemplo: Fecha específica
    // '2026-07-04', // Ejemplo: 4 de Julio (USA)
];

/**
 * Verifica si una fecha es un día feriado
 * @param {Date} date - Fecha a verificar
 * @returns {boolean} - true si es feriado, false si no
 */
function isHoliday(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const fullDate = `${year}-${month}-${day}`;
    const shortDate = `${month}-${day}`;
    
    return HOLIDAYS.includes(fullDate) || HOLIDAYS.includes(shortDate);
}

/**
 * Obtiene el nombre del feriado (opcional, para mostrar en tooltips)
 * @param {Date} date - Fecha del feriado
 * @returns {string} - Nombre del feriado o vacío
 */
function getHolidayName(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const shortDate = `${month}-${day}`;
    
    const holidayNames = {
        '01-01': 'Año Nuevo',
        '01-06': 'Día de Reyes',
        '16-02': 'Carnaval',
        '17-02': 'Carnaval',
        '05-01': 'Día del Trabajo',
        '12-25': 'Navidad',
    };
    
    return holidayNames[shortDate] || 'Día Feriado';
}
