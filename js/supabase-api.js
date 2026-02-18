// ===== API MANAGER CON SUPABASE =====

class SupabaseAPIManager {
    constructor() {
        this.citas = [];
        this.init();
    }

    init() {
        // Verificar que Supabase esté configurado
        if (!window.supabase) {
            console.error('⚠️ Supabase client no está inicializado');
            showToast('Error: Supabase no configurado', 'error');
            return;
        }

        this.loadCitas();
    }

    // ===== CARGAR TODAS LAS CITAS =====
    async loadCitas() {
        try {
            console.log('📥 Cargando citas desde Supabase...');

            const data = await window.supabase.select('citas', {
                order: 'fecha.desc,hora.desc'
            });

            if (data && data.length > 0) {
                this.citas = data.map(cita => this.formatCita(cita));
                window.calendarManager?.updateCalendar(this.citas);
                console.log(`✅ ${this.citas.length} citas cargadas`);
                showToast(`${this.citas.length} citas cargadas`, 'success');
            } else {
                this.citas = [];
                window.calendarManager?.updateCalendar([]);
                console.log('📭 No hay citas registradas');
                showToast('No hay citas registradas', 'info');
            }

            this.updateSyncTime();
        } catch (error) {
            console.error('❌ Error cargando citas:', error);
            showToast(`Error al cargar citas: ${error.message}`, 'error');
        }
    }

    // ===== FORMATEAR CITA DESDE SUPABASE =====
    formatCita(cita) {
        return {
            id: cita.id,
            paciente: cita.paciente || '',
            apellido: cita.apellido || '',
            carrera: cita.carrera || '',
            fecha: cita.fecha || '',
            hora: cita.hora ? cita.hora.substring(0, 5) : '', // "14:30:00" -> "14:30"
            duracion: cita.duracion || 45,
            estado: cita.estado || 'pendiente',
            notas: cita.notas || '',
            timestamp: cita.timestamp || Date.now(),
            created_at: cita.created_at
        };
    }

    // ===== GUARDAR NUEVA CITA =====
    async saveCita(citaData, isEditing = false) {
        try {
            // Si es edición, usar updateCita
            if (isEditing && citaData.id) {
                return await this.updateCita(citaData.id, citaData);
            }

            // Nueva cita
            console.log('💾 Guardando cita en Supabase...', citaData);

            // Preparar datos para Supabase
            const supabaseData = {
                paciente: citaData.paciente,
                apellido: citaData.apellido || '',
                carrera: citaData.carrera || '',
                fecha: citaData.fecha,
                hora: citaData.hora + ':00', // "14:30" -> "14:30:00"
                duracion: parseInt(citaData.duracion) || 45,
                estado: citaData.estado || 'pendiente',
                notas: citaData.notas || '',
                timestamp: Date.now()
            };

            const result = await window.supabase.insert('citas', supabaseData);

            if (result && result.length > 0) {
                const nuevaCita = this.formatCita(result[0]);
                this.citas.push(nuevaCita);
                window.calendarManager?.updateCalendar(this.citas);
                console.log('✅ Cita guardada:', nuevaCita);
                showToast('✅ Cita guardada exitosamente', 'success');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error guardando cita:', error);
            showToast(`Error: ${error.message}`, 'error');
            return false;
        }
    }

    // ===== ACTUALIZAR CITA EXISTENTE =====
    async updateCita(id, citaData) {
        try {
            console.log('✏️ Actualizando cita...', id, citaData);

            // Preparar datos para actualización
            const updateData = {
                paciente: citaData.paciente,
                apellido: citaData.apellido || '',
                carrera: citaData.carrera || '',
                fecha: citaData.fecha,
                hora: citaData.hora.includes(':00') ? citaData.hora : citaData.hora + ':00',
                duracion: parseInt(citaData.duracion) || 45,
                estado: citaData.estado || 'pendiente',
                notas: citaData.notas || ''
            };

            const result = await window.supabase.update('citas', id, updateData);

            if (result && result.length > 0) {
                // Actualizar en el array local
                const index = this.citas.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.citas[index] = this.formatCita(result[0]);
                    window.calendarManager?.updateCalendar(this.citas);
                }
                console.log('✅ Cita actualizada');
                showToast('✅ Cita actualizada', 'success');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error actualizando cita:', error);
            showToast(`Error: ${error.message}`, 'error');
            return false;
        }
    }

    // ===== ELIMINAR CITA =====
    async deleteCita(id) {
        try {
            console.log('🗑️ Eliminando cita...', id);

            const result = await window.supabase.delete('citas', id);

            if (result.success) {
                // Eliminar del array local
                this.citas = this.citas.filter(c => c.id !== id);
                window.calendarManager?.updateCalendar(this.citas);
                console.log('✅ Cita eliminada');
                showToast('✅ Cita eliminada', 'success');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error eliminando cita:', error);
            showToast(`Error: ${error.message}`, 'error');
            return false;
        }
    }

    // ===== OBTENER ESTADÍSTICAS =====
    async getStats() {
        try {
            const stats = {
                total: this.citas.length,
                pendientes: this.citas.filter(c => c.estado === 'pendiente').length,
                asistieron: this.citas.filter(c => c.estado === 'asistio').length,
                noAsistieron: this.citas.filter(c => c.estado === 'no-asistio').length,
                reprogramaron: this.citas.filter(c => c.estado === 'reprogramo').length,
                
                // Citas por mes
                porMes: this.getCitasPorMes(),
                
                // Horas más ocupadas
                horasMasOcupadas: this.getHorasMasOcupadas(),
                
                // Tasa de asistencia
                tasaAsistencia: this.getTasaAsistencia(),
                
                // Pacientes más frecuentes
                pacientesFrecuentes: this.getPacientesFrecuentes()
            };

            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo stats:', error);
            return null;
        }
    }

    // ===== CITAS POR MES =====
    getCitasPorMes() {
        const porMes = {};
        
        this.citas.forEach(cita => {
            if (!cita.fecha) return;
            
            const fecha = new Date(cita.fecha + 'T00:00:00');
            const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            if (!porMes[mesAno]) {
                porMes[mesAno] = 0;
            }
            porMes[mesAno]++;
        });

        // Convertir a array y ordenar
        return Object.entries(porMes)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([mes, cantidad]) => ({ mes, cantidad }));
    }

    // ===== HORAS MÁS OCUPADAS =====
    getHorasMasOcupadas() {
        const porHora = {};
        
        this.citas.forEach(cita => {
            if (!cita.hora) return;
            
            const hora = cita.hora.substring(0, 2); // "14:30" -> "14"
            
            if (!porHora[hora]) {
                porHora[hora] = 0;
            }
            porHora[hora]++;
        });

        // Convertir a array y ordenar por cantidad
        return Object.entries(porHora)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Top 10
            .map(([hora, cantidad]) => ({ hora: `${hora}:00`, cantidad }));
    }

    // ===== TASA DE ASISTENCIA =====
    getTasaAsistencia() {
        const citasPasadas = this.citas.filter(c => {
            if (!c.fecha) return false;
            const fechaCita = new Date(c.fecha + 'T00:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return fechaCita < hoy;
        });

        const citasConfirmadas = citasPasadas.filter(c => c.estado === 'asistio' || c.estado === 'no-asistio');
        const citasAsistieron = citasPasadas.filter(c => c.estado === 'asistio');

        if (citasConfirmadas.length === 0) {
            return 0;
        }

        return Math.round((citasAsistieron.length / citasConfirmadas.length) * 100);
    }

    // ===== PACIENTES MÁS FRECUENTES =====
    getPacientesFrecuentes() {
        const porPaciente = {};
        
        this.citas.forEach(cita => {
            if (!cita.paciente) return;
            
            // Nombre completo
            const nombreCompleto = cita.apellido ? 
                `${cita.paciente} ${cita.apellido}`.trim() : 
                cita.paciente.trim();
            
            if (!porPaciente[nombreCompleto]) {
                porPaciente[nombreCompleto] = 0;
            }
            porPaciente[nombreCompleto]++;
        });

        // Convertir a array y ordenar por cantidad
        return Object.entries(porPaciente)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Top 10
            .map(([paciente, cantidad]) => ({ paciente, cantidad }));
    }

    // ===== ACTUALIZAR HORA DE ÚLTIMA SINCRONIZACIÓN =====
    updateSyncTime() {
        const syncElement = document.getElementById('lastSync');
        if (syncElement) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            syncElement.textContent = `Última sincronización: ${timeStr}`;
        }
    }

    // ===== REFRESCAR DATOS =====
    async refresh() {
        await this.loadCitas();
    }
}

// ===== INICIALIZAR =====
console.log('📦 Supabase API Manager cargado');

// Crear instancia global (compatible con código existente)
window.sheetsAPI = new SupabaseAPIManager();
window.supabaseAPI = window.sheetsAPI; // Alias opcional
