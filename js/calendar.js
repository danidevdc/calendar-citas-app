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

            // ✅ Validar que el día no esté totalmente ocupado
            if (this.isDayFullyBooked(dateStr)) {
                showToast('❌ Este día ya tiene todas las horas ocupadas', 'error');
                return;
            }
            
            const modal = document.getElementById('citaModal');
            const title = document.getElementById('citaTitle');
            const form = document.getElementById('citaForm');

            title.textContent = 'Nueva Cita';
            form.reset();
            this.editingCita = null;

            // Usar la fecha ya parseada
            document.getElementById('citaDate').value = dateStr;
            
            // ✅ Si viene con hora específica (vista semanal), usarla; si no, primera hora disponible
            const timeStr = info.dateStr.includes('T') 
                ? info.dateStr.split('T')[1].substring(0, 5) 
                : this.getFirstAvailableHour(dateStr);
            
            document.getElementById('citaTime').value = timeStr;
            document.getElementById('citaDuration').value = '45';
            document.getElementById('deleteCitaBtn').style.display = 'none';

            // ✅ Actualizar horas disponibles
            this.updateAvailableHours();

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
            
            // ✅ Establecer primera hora disponible por defecto
            const fechaSeleccionada = document.getElementById('citaDate').value;
            const horaDisponible = this.getFirstAvailableHour(fechaSeleccionada);
            document.getElementById('citaTime').value = horaDisponible;
            
            document.getElementById('citaDuration').value = '45';
            deleteBtn.style.display = 'none';
            this.editingCita = null;
        }

        modal.classList.add('active');
        
        // ✅ Actualizar horas disponibles
        setTimeout(() => {
            this.updateAvailableHours();
        }, 50);
        
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

        // ✅ Marcar días totalmente ocupados
        const dateStr = info.date.toISOString().split('T')[0];
        if (this.isDayFullyBooked(dateStr) && cellDate >= today) {
            classes.push('fc-day-fully-booked');
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
        const citaDateInput = document.getElementById('citaDate');
        const citaTimeInput = document.getElementById('citaTime');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCita();
        });

        deleteBtn.addEventListener('click', async () => {
            if (this.editingCita && confirm('¿Eliminar esta cita?')) {
                // ✅ Guardar ID antes de cerrar
                const citaId = this.editingCita.id;
                
                // ✅ Cerrar modal inmediatamente para mejor UX
                document.getElementById('citaModal').classList.remove('active');
                this.editingCita = null;
                
                showToast('🗑️ Eliminando cita...', 'info');
                
                const success = await sheetsAPI.deleteCita(citaId);
                
                if (success) {
                    showToast('✅ Cita eliminada correctamente', 'success');
                    // Recargar citas y actualizar calendario
                    setTimeout(() => {
                        this.updateCalendar(sheetsAPI.citas);
                    }, 300);
                }
            }
        });

        // ✅ Detectar cambios en la fecha para actualizar horas disponibles
        citaDateInput.addEventListener('change', () => {
            this.updateAvailableHours();
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

        // ✅ Validar que la hora esté disponible
        if (!this.isTimeSlotAvailable(fecha, hora, duracion)) {
            showToast('❌ Esta hora ya está ocupada. Por favor selecciona otra hora disponible', 'error');
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

    // ===== 🆕 OBTENER PRIMERA HORA DISPONIBLE =====
    getFirstAvailableHour(fecha) {
        const horasLaborales = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        if (!fecha) return horasLaborales[0]; // Retornar 08:00 si no hay fecha

        const horasOcupadas = this.getOccupiedHours(fecha);
        
        // Buscar la primera hora disponible
        for (const hora of horasLaborales) {
            if (!horasOcupadas.includes(hora)) {
                return hora;
            }
        }
        
        // Si todas están ocupadas, retornar la primera de todas formas (el sistema validará)
        return horasLaborales[0];
    }

    // ===== 🆕 OBTENER HORAS OCUPADAS EN UNA FECHA =====
    getOccupiedHours(fecha) {
        if (!fecha || !this.citas) return [];

        const citasDelDia = this.citas.filter(cita => cita.fecha === fecha);
        const horasOcupadas = [];

        citasDelDia.forEach(cita => {
            if (cita.hora) {
                const [hora, minuto] = cita.hora.split(':');
                const duracion = cita.duracion || 45;

                // Calcular inicio y fin del slot
                const inicioMinutos = parseInt(hora) * 60 + parseInt(minuto);
                const finMinutos = inicioMinutos + duracion;

                // Agregar todos los bloques de 30 minutos ocupados
                for (let t = inicioMinutos; t < finMinutos; t += 30) {
                    const h = Math.floor(t / 60);
                    const m = t % 60;
                    const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    if (!horasOcupadas.includes(horaStr)) {
                        horasOcupadas.push(horaStr);
                    }
                }
            }
        });

        return horasOcupadas;
    }

    // ===== 🆕 VERIFICAR SI UN DÍA ESTÁ TOTALMENTE OCUPADO =====
    isDayFullyBooked(fecha) {
        const horasLaborales = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        const horasOcupadas = this.getOccupiedHours(fecha);
        
        // Verificar si todas las horas laborales están ocupadas
        const horasDisponibles = horasLaborales.filter(hora => !horasOcupadas.includes(hora));
        
        return horasDisponibles.length === 0;
    }

    // ===== 🆕 ACTUALIZAR HORAS DISPONIBLES EN EL SELECTOR =====
    updateAvailableHours() {
        const dateInput = document.getElementById('citaDate');
        const timeInput = document.getElementById('citaTime');
        
        if (!dateInput || !timeInput) return;

        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        const horasOcupadas = this.getOccupiedHours(selectedDate);
        const horaActual = timeInput.value;

        // Eliminar datalist anterior si existe
        let datalist = document.getElementById('horasDisponibles');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'horasDisponibles';
            timeInput.parentNode.appendChild(datalist);
            timeInput.setAttribute('list', 'horasDisponibles');
        }

        // Limpiar opciones anteriores
        datalist.innerHTML = '';

        // Horario laboral: 8:00 AM a 5:00 PM
        const horasLaborales = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        // Agregar solo horas disponibles
        horasLaborales.forEach(hora => {
            const isOcupada = horasOcupadas.includes(hora);
            const isEditing = this.editingCita && this.editingCita.hora === hora;
            
            // Permitir la hora actual si estamos editando esa cita
            if (!isOcupada || isEditing) {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                datalist.appendChild(option);
            }
        });

        // Mostrar mensaje si hay horas ocupadas
        if (horasOcupadas.length > 0 && !this.editingCita) {
            const ocupadasText = horasOcupadas.slice(0, 3).join(', ');
            const masText = horasOcupadas.length > 3 ? ` (+${horasOcupadas.length - 3} más)` : '';
            console.log(`⚠️ Horas ocupadas: ${ocupadasText}${masText}`);
        }
    }

    // ===== 🆕 VERIFICAR SI UNA HORA ESTÁ DISPONIBLE =====
    isTimeSlotAvailable(fecha, hora, duracion = 45) {
        if (!fecha || !hora) return true;

        // Si estamos editando, permitir la hora actual de la cita
        if (this.editingCita && this.editingCita.fecha === fecha && this.editingCita.hora === hora) {
            return true;
        }

        const horasOcupadas = this.getOccupiedHours(fecha);
        const [h, m] = hora.split(':').map(Number);
        const inicioMinutos = h * 60 + m;
        const finMinutos = inicioMinutos + duracion;

        // Verificar cada bloque de 30 minutos del slot solicitado
        for (let t = inicioMinutos; t < finMinutos; t += 30) {
            const horaCheck = Math.floor(t / 60);
            const minCheck = t % 60;
            const horaStr = `${horaCheck.toString().padStart(2, '0')}:${minCheck.toString().padStart(2, '0')}`;
            
            if (horasOcupadas.includes(horaStr)) {
                return false;
            }
        }

        return true;
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