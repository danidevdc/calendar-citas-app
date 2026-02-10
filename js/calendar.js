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
        this.autoSyncCitas();
    }

    // ===== INICIALIZAR FULLCALENDAR =====
    setupCalendar() {
        const calendarEl = document.getElementById('calendar');

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: this.currentView,
            locale: 'es',
            firstDay: 0, // Comenzar la semana en domingo
            headerToolbar: false, // Usamos nuestros propios controles
            height: 'auto',
            contentHeight: 'auto',
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
        return citas.map(cita => {
            const [year, month, day] = cita.fecha.split('-');
            const [hour, minute] = cita.hora.split(':');
            const startTime = new Date(year, month - 1, day, hour, minute);
            const endTime = new Date(startTime.getTime() + cita.duracion * 60000);

            // Mostrar nombre completo en el calendario
            const nombreCompleto = cita.apellido ? `${cita.paciente} ${cita.apellido}` : cita.paciente;

            return {
                id: cita.id,
                title: `${nombreCompleto} (${cita.tipo})`,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                backgroundColor: this.getColorByType(cita.tipo),
                borderColor: this.getColorByType(cita.tipo),
                extendedProps: cita
            };
        });
    }

    // ===== COLORES POR TIPO DE SESIÓN =====
    getColorByType(tipo) {
        const colors = {
            presencial: '#667eea',
            virtual: '#f5576c',
            telefonica: '#4facfe'
        };
        return colors[tipo] || colors.presencial;
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
            const modal = document.getElementById('citaModal');
            const title = document.getElementById('citaTitle');
            const form = document.getElementById('citaForm');

            title.textContent = 'Nueva Cita';
            form.reset();
            this.editingCita = null;

            document.getElementById('citaDate').value = info.dateStr;
            document.getElementById('citaTime').value = '09:00';
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
            document.getElementById('pacienteName').value = cita.paciente;
            document.getElementById('pacienteApellido').value = cita.apellido || '';
            document.getElementById('pacienteCarrera').value = cita.carrera || '';
            document.getElementById('citaDate').value = cita.fecha;
            document.getElementById('citaTime').value = cita.hora;
            document.getElementById('citaDuration').value = cita.duracion;
            document.getElementById('citaTipo').value = cita.tipo;
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
                info.el.title = holidayName;
            }
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
        const paciente = document.getElementById('pacienteName').value.trim();
        const apellido = document.getElementById('pacienteApellido').value.trim();
        const carrera = document.getElementById('pacienteCarrera').value.trim();
        const fecha = document.getElementById('citaDate').value;
        const hora = document.getElementById('citaTime').value;
        const duracion = parseInt(document.getElementById('citaDuration').value);
        const tipo = document.getElementById('citaTipo').value;
        const notas = document.getElementById('citaNotas').value.trim();

        if (!paciente || !apellido || !carrera || !fecha || !hora) {
            showToast('Por favor completa todos los campos obligatorios (Nombre, Apellido, Carrera, Fecha y Hora)', 'error');
            return;
        }

        const cita = {
            id: this.editingCita?.id || `cita_${Date.now()}`,
            paciente,
            apellido,
            carrera,
            fecha,
            hora,
            duracion,
            tipo,
            notas,
            timestamp: Date.now()
        };

        const success = await sheetsAPI.saveCita(cita);

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
}

// Inicializar calendar manager cuando esté lista la app
window.calendarManager = new CalendarManager();