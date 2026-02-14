// ===== GESTOR DEL CALENDARIO =====

class CalendarManager {
    constructor() {
        this.calendar = null;
        this.currentView = 'dayGridMonth';
        this.citas = [];
        this.editingCita = null;
        this.init();
    }

    init() {
        this.setupCalendar();
        this.setupEventListeners();
        this.setupCitaForm();
        // ✅ NO cargar mocks aquí - dejar que SheetsAPI decida
        // this.loadMockDataIfNeeded() se llamará desde SheetsAPI si es necesario
        this.autoSyncCitas();
    }

    // ===== INICIALIZAR FULLCALENDAR =====
    setupCalendar() {
        const calendarEl = document.getElementById('calendar');

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: this.currentView,
            locale: 'es',
            firstDay: 1, // ✅ Comenzar la semana en lunes (más estándar en España/Latinoamérica)
            headerToolbar: false, // Usamos nuestros propios controles
            height: 'auto',
            contentHeight: 'auto',
            allDaySlot: false, // Ocultar la fila "all day"
            // Configuración de horario para vista semanal
            slotMinTime: '08:00:00',
            slotMaxTime: '17:00:00',
            slotDuration: '00:30:00',
            slotLabelInterval: '01:00',
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            events: (info, successCallback, failureCallback) => {
                const events = this.formatEventsForCalendar(this.citas);
                successCallback(events);
            },
            eventClick: (info) => this.handleEventClick(info),
            dateClick: (info) => this.handleDateClick(info),
            dayCellClassNames: (info) => this.getDayCellClasses(info),
            dayCellDidMount: (info) => this.styleDayCell(info),
            datesSet: (info) => this.updateMonthYearDisplay(info),
        });

        this.calendar.render();
    }

    // ===== CONVERTIR CITAS A EVENTOS DEL CALENDARIO =====
    formatEventsForCalendar(citas) {
        const eventos = [];
        
        for (const cita of citas) {
            try {
                // Validar que existan fecha y hora
                if (!cita.fecha || !cita.hora) {
                    console.warn('⚠️ Cita sin fecha/hora:', cita);
                    continue;
                }

                const [year, month, day] = cita.fecha.split('-').map(Number);
                const [hour, minute] = cita.hora.split(':').map(Number);
                
                // Crear fechas y validar
                const startTime = new Date(year, month - 1, day, hour, minute);
                
                if (isNaN(startTime.getTime())) {
                    console.warn('⚠️ Fecha inválida ignorada:', cita.fecha, cita.hora);
                    continue;
                }
                
                const endTime = new Date(startTime.getTime() + (cita.duracion || 45) * 60000);

                // Mostrar nombre completo en el calendario
                const nombreCompleto = cita.apellido ? `${cita.paciente} ${cita.apellido}` : cita.paciente;

                eventos.push({
                    id: cita.id,
                    title: `${nombreCompleto} (${this.getEstadoLabel(cita.estado)})`,
                    start: startTime.toISOString(),
                    end: endTime.toISOString(),
                    backgroundColor: this.getColorByEstado(cita.estado),
                    borderColor: this.getColorByEstado(cita.estado),
                    extendedProps: cita
                });
            } catch (error) {
                console.error('❌ Error procesando cita:', cita, error);
                // Continuar con la siguiente cita
            }
        }
        
        return eventos;
    }

    // ===== COLORES POR ESTADO DE ASISTENCIA =====
    getColorByEstado(estado) {
        const colors = {
            'pendiente': '#667eea',    // Morado - Aún no sucede
            'asistio': '#4ade80',      // Verde - Asistió
            'no-asistio': '#f87171',   // Rojo - No asistió
            'reprogramo': '#fbbf24'    // Amarillo - Reprogramó
        };
        return colors[estado] || colors.pendiente;
    }

    // ===== ETIQUETA LEGIBLE DEL ESTADO =====
    getEstadoLabel(estado) {
        const labels = {
            'pendiente': 'Pendiente',
            'asistio': 'Asistió',
            'no-asistio': 'No Asistió',
            'reprogramo': 'Reprogramó'
        };
        return labels[estado] || 'Pendiente';
    }

    // ===== MANEJAR CLICK EN EVENTO =====
    handleEventClick(info) {
        const cita = info.event.extendedProps;
        this.editingCita = cita;
        this.openCitaModal(cita);
    }

    // ===== MANEJAR CLICK EN DÍA =====
    handleDateClick(info) {
        if (!this.editingCita) {
            // Parsear la fecha correctamente evitando problemas de zona horaria
            const dateStr = info.dateStr.split('T')[0];
            const [year, month, day] = dateStr.split('-');
            const clickedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            // Para la validación de hora en vista semanal
            let clickedDateTime;
            if (info.dateStr.includes('T')) {
                const timeStr = info.dateStr.split('T')[1];
                const [hour, minute] = timeStr.split(':');
                clickedDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            } else {
                clickedDateTime = clickedDate;
            }
            
            const now = new Date();
            
            // Validar que no sea una fecha/hora pasada
            if (clickedDateTime < now) {
                showToast('No puedes agendar citas en fechas u horas pasadas', 'error');
                return;
            }
            
            // Validar que no sea feriado (prioridad sobre fin de semana)
            if (typeof isHoliday === 'function' && isHoliday(clickedDate)) {
                const holidayName = typeof getHolidayName === 'function' ? getHolidayName(clickedDate) : 'día feriado';
                showToast(`No puedes agendar citas en ${holidayName}`, 'error');
                return;
            }
            
            // Validar que no sea fin de semana (0 = Domingo, 6 = Sábado)
            const dayOfWeek = clickedDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                showToast('No puedes agendar citas en fines de semana', 'error');
                return;
            }
            
            const modal = document.getElementById('citaModal');
            const title = document.getElementById('citaTitle');
            const form = document.getElementById('citaForm');

            title.textContent = 'Nueva Cita';
            form.reset();
            this.editingCita = null;

            // Usar la fecha ya parseada
            const timeStr = info.dateStr.includes('T') ? info.dateStr.split('T')[1].substring(0, 5) : '09:00';
            
            document.getElementById('citaDate').value = dateStr;
            document.getElementById('citaTime').value = timeStr;
            document.getElementById('citaDuration').value = '45';
            document.getElementById('deleteCitaBtn').style.display = 'none';

            modal.classList.add('active');
        }
    }

    // ===== ABRIR MODAL DE CITA =====
    openCitaModal(cita = null) {
        const modal = document.getElementById('citaModal');
        const title = document.getElementById('citaTitle');
        const form = document.getElementById('citaForm');
        const deleteBtn = document.getElementById('deleteCitaBtn');

        if (cita) {
            title.textContent = 'Editar Cita';
            // Combinar nombre y apellido para mostrar en el campo único
            const nombreCompleto = cita.apellido ? `${cita.paciente} ${cita.apellido}` : cita.paciente;
            document.getElementById('pacienteNombreCompleto').value = nombreCompleto;
            document.getElementById('pacienteCarrera').value = cita.carrera || '';
            document.getElementById('citaDate').value = cita.fecha;
            document.getElementById('citaTime').value = cita.hora;
            document.getElementById('citaDuration').value = cita.duracion;
            document.getElementById('citaEstado').value = cita.estado || 'pendiente';
            document.getElementById('citaNotas').value = cita.notas;
            deleteBtn.style.display = 'block';
        } else {
            title.textContent = 'Nueva Cita';
            form.reset();
            document.getElementById('citaTime').value = '09:00';
            document.getElementById('citaDuration').value = '45';
            deleteBtn.style.display = 'none';
            this.editingCita = null;
        }

        modal.classList.add('active');
        
        // Detectar si el modal tiene contenido que necesita scroll
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent.scrollHeight > modalContent.clientHeight) {
                modalContent.classList.add('has-scroll');
            } else {
                modalContent.classList.remove('has-scroll');
            }
        }, 100);
    }

    // ===== ESTILOS DE CELDAS =====
    getDayCellClasses(info) {
        const classes = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const cellDate = new Date(info.date);
        cellDate.setHours(0, 0, 0, 0);
        
        // Marcar días pasados
        if (cellDate < today && !info.isToday) {
            classes.push('fc-day-past');
        }
        
        // Marcar días feriados
        if (typeof isHoliday === 'function' && isHoliday(cellDate)) {
            classes.push('fc-day-holiday');
        }
        
        // Marcar fines de semana
        const dayOfWeek = cellDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            classes.push('fc-day-weekend');
        }
        
        return classes;
    }

    styleDayCell(info) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const cellDate = new Date(info.date);
        cellDate.setHours(0, 0, 0, 0);
        
        // Marcar día actual
        if (info.isToday) {
            info.el.classList.add('fc-day-today');
        }
        
        // Marcar días pasados
        if (cellDate < today) {
            info.el.classList.add('fc-day-past');
        }
        
        // Marcar días feriados (si la función existe)
        if (typeof isHoliday === 'function' && isHoliday(cellDate)) {
            info.el.classList.add('fc-day-holiday');
            
            // Agregar tooltip opcional con el nombre del feriado
            if (typeof getHolidayName === 'function') {
                const holidayName = getHolidayName(cellDate);
                info.el.title = holidayName + ' (No disponible)';
            }
        }
        
        // Marcar fines de semana
        const dayOfWeek = cellDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            info.el.classList.add('fc-day-weekend');
            info.el.title = 'Fin de semana (No disponible)';
        }
    }

    // ===== ACTUALIZAR DISPLAY DE MES Y AÑO =====
    updateMonthYearDisplay(info) {
        const monthYear = document.getElementById('monthYear');
        
        // Usar la fecha del centro del rango visible para asegurar el mes correcto
        const startTime = info.start.getTime();
        const endTime = info.end.getTime();
        const middleTime = startTime + (endTime - startTime) / 2;
        const middleDate = new Date(middleTime);
        
        const formatter = new Intl.DateTimeFormat('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });
        const formattedDate = formatter.format(middleDate);
        monthYear.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    // ===== SETUP DE LISTENERS =====
    setupEventListeners() {
        // Vista Mes / Semana
        document.getElementById('monthViewBtn').addEventListener('click', () => {
            this.changeView('dayGridMonth');
        });

        document.getElementById('weekViewBtn').addEventListener('click', () => {
            this.changeView('timeGridWeek');
        });

        // Navegación
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.calendar.prev();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.calendar.next();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.calendar.today();
        });

        // Sincronizar ahora
        document.getElementById('syncNowBtn').addEventListener('click', () => {
            this.syncNow();
        });

        // Nueva cita
        document.getElementById('addCitaBtn').addEventListener('click', () => {
            this.editingCita = null;
            this.openCitaModal();
        });

        // Cerrar modal
        document.getElementById('closeCitaBtn').addEventListener('click', () => {
            document.getElementById('citaModal').classList.remove('active');
            this.editingCita = null;
        });

        document.getElementById('cancelCitaBtn').addEventListener('click', () => {
            document.getElementById('citaModal').classList.remove('active');
            this.editingCita = null;
        });

        // Fuera del modal
        document.getElementById('citaModal').addEventListener('click', (e) => {
            if (e.target.id === 'citaModal') {
                document.getElementById('citaModal').classList.remove('active');
                this.editingCita = null;
            }
        });
    }

    // ===== SETUP DEL FORMULARIO =====
    setupCitaForm() {
        const form = document.getElementById('citaForm');
        const deleteBtn = document.getElementById('deleteCitaBtn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCita();
        });

        deleteBtn.addEventListener('click', () => {
            if (this.editingCita && confirm('¿Eliminar esta cita?')) {
                sheetsAPI.deleteCita(this.editingCita.id);
                document.getElementById('citaModal').classList.remove('active');
                this.editingCita = null;
            }
        });
    }

    // ===== GUARDAR CITA =====
    async saveCita() {
        const nombreCompleto = document.getElementById('pacienteNombreCompleto').value.trim();
        const carrera = document.getElementById('pacienteCarrera').value.trim();
        const fecha = document.getElementById('citaDate').value;
        const hora = document.getElementById('citaTime').value;
        const duracion = parseInt(document.getElementById('citaDuration').value);
        const estado = document.getElementById('citaEstado').value;
        const notas = document.getElementById('citaNotas').value.trim();

        if (!nombreCompleto || !carrera || !fecha || !hora) {
            showToast('Por favor completa todos los campos obligatorios (Nombre Completo, Carrera, Fecha y Hora)', 'error');
            return;
        }

        // Validar que no sea una fecha u hora pasada
        const [year, month, day] = fecha.split('-');
        const [hourVal, minuteVal] = hora.split(':');
        const citaDateTime = new Date(year, month - 1, day, hourVal, minuteVal);
        const now = new Date();
        
        if (citaDateTime < now) {
            showToast('No puedes agendar citas en fechas u horas pasadas', 'error');
            return;
        }
        
        // Validar que no sea fin de semana
        const dayOfWeek = citaDateTime.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            showToast('No puedes agendar citas en fines de semana', 'error');
            return;
        }
        
        // Validar que no sea feriado
        if (typeof isHoliday === 'function' && isHoliday(citaDateTime)) {
            const holidayName = typeof getHolidayName === 'function' ? getHolidayName(citaDateTime) : 'día feriado';
            showToast(`No puedes agendar citas en ${holidayName}`, 'error');
            return;
        }

        // Dividir el nombre completo en nombre y apellido
        // El primer espacio separa nombre de apellido(s)
        const nombreParts = nombreCompleto.split(' ');
        const paciente = nombreParts[0];
        const apellido = nombreParts.length > 1 ? nombreParts.slice(1).join(' ') : '';

        const cita = {
            id: this.editingCita?.id || `cita_${Date.now()}`,
            paciente,
            apellido,
            carrera,
            fecha,
            hora,
            duracion,
            estado,
            notas,
            timestamp: Date.now()
        };

        // 🔄 Detectar si es edición o nueva cita
        const isEditing = this.editingCita !== null;
        const success = await sheetsAPI.saveCita(cita, isEditing);

        if (success) {
            document.getElementById('citaModal').classList.remove('active');
            this.editingCita = null;
        }
    }

    // ===== CAMBIAR VISTA =====
    changeView(viewName) {
        this.currentView = viewName;
        this.calendar.changeView(viewName);

        // Actualizar botones
        document.getElementById('monthViewBtn').classList.toggle('active', viewName === 'dayGridMonth');
        document.getElementById('weekViewBtn').classList.toggle('active', viewName === 'timeGridWeek');
    }

    // ===== CARGAR DATOS DE EJEMPLO (MOCK) - DESHABILITADO =====
    loadMockDataIfNeeded() {
        // 🚫 Función deshabilitada - no cargar mocks
        console.log('🚫 Datos mockeados deshabilitados - usando solo datos reales');
        return false;
    }

    // ===== ACTUALIZAR CALENDARIO =====
    updateCalendar(citas) {
        this.citas = citas;
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }

    // ===== AUTO SYNC =====
    autoSyncCitas() {
        // Sincronizar cada 5 minutos
        setInterval(() => {
            sheetsAPI.loadCitas();
        }, 5 * 60 * 1000);
    }

    // ===== SINCRONIZAR AHORA (MANUAL) =====
    async syncNow() {
        const syncBtn = document.getElementById('syncNowBtn');
        const icon = syncBtn.querySelector('i');
        
        // Animar el botón
        icon.classList.add('fa-spin');
        syncBtn.disabled = true;
        
        // Sincronizar
        await sheetsAPI.loadCitas();
        
        // Restaurar botón
        setTimeout(() => {
            icon.classList.remove('fa-spin');
            syncBtn.disabled = false;
        }, 500);
    }
}

// Inicializar calendar manager cuando esté lista la app
window.calendarManager = new CalendarManager();