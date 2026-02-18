// ===== GESTOR DE ESTADÍSTICAS =====

class StatsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        // Esperar a que Supabase esté listo
        await this.waitForSupabase();
        
        // Cargar estadísticas
        await this.loadStats();

        // Event listeners
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadStats());
    }

    // Esperar a que Supabase y API estén listos
    async waitForSupabase() {
        let attempts = 0;
        while (!window.sheetsAPI && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.sheetsAPI) {
            console.error('⚠️ Supabase API no se pudo inicializar');
            return false;
        }

        // Esperar a que las citas se carguen
        let loadAttempts = 0;
        while (window.sheetsAPI.citas.length === 0 && loadAttempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            loadAttempts++;
        }

        return true;
    }

    // Cargar estadísticas
    async loadStats() {
        try {
            console.log('📊 Cargando estadísticas...');

            // Mostrar loading
            document.getElementById('loading').style.display = 'block';
            document.getElementById('statsContent').style.display = 'none';

            // Obtener estadísticas
            const stats = await window.sheetsAPI.getStats();

            if (!stats) {
                throw new Error('No se pudieron obtener las estadísticas');
            }

            console.log('📊 Estadísticas:', stats);

            // Actualizar tarjetas de resumen
            this.updateSummaryCards(stats);

            // Crear/actualizar gráficas
            this.createCitasPorMesChart(stats.porMes);
            this.createHorasOcupadasChart(stats.horasMasOcupadas);
            this.updatePacientesTable(stats.pacientesFrecuentes);

            // Ocultar loading y mostrar contenido
            document.getElementById('loading').style.display = 'none';
            document.getElementById('statsContent').style.display = 'block';

            console.log('✅ Estadísticas cargadas');
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            document.getElementById('loading').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar estadísticas</p>
                <p style="font-size: 14px; margin-top: 10px;">${error.message}</p>
            `;
        }
    }

    // Actualizar tarjetas de resumen
    updateSummaryCards(stats) {
        document.getElementById('totalCitas').textContent = stats.total;
        document.getElementById('asistieron').textContent = stats.asistieron;
        document.getElementById('noAsistieron').textContent = stats.noAsistieron;
        document.getElementById('tasaAsistencia').textContent = `${stats.tasaAsistencia}%`;
    }

    // Gráfica de Citas por Mes
    createCitasPorMesChart(data) {
        const ctx = document.getElementById('citasPorMesChart').getContext('2d');

        // Destruir gráfica anterior si existe
        if (this.charts.citasPorMes) {
            this.charts.citasPorMes.destroy();
        }

        // Formatear datos
        const labels = data.map(item => {
            const [year, month] = item.mes.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
        });

        const valores = data.map(item => item.cantidad);

        // Crear gráfica
        this.charts.citasPorMes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Citas',
                    data: valores,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return `Citas: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Horas Más Ocupadas
    createHorasOcupadasChart(data) {
        const ctx = document.getElementById('horasOcupadasChart').getContext('2d');

        // Destruir gráfica anterior si existe
        if (this.charts.horasOcupadas) {
            this.charts.horasOcupadas.destroy();
        }

        // Formatear datos
        const labels = data.map(item => item.hora);
        const valores = data.map(item => item.cantidad);

        // Crear gráfica
        this.charts.horasOcupadas = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Citas',
                    data: valores,
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(74, 222, 128, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(248, 113, 113, 0.8)',
                        'rgba(96, 165, 250, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(167, 139, 250, 0.8)',
                        'rgba(251, 113, 133, 0.8)',
                        'rgba(52, 211, 153, 0.8)'
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label} (${value})`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} citas (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Tabla de Pacientes Frecuentes
    updatePacientesTable(data) {
        const tbody = document.getElementById('pacientesTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: #6c757d; padding: 30px;">
                        No hay datos disponibles
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td>${item.paciente}</td>
                <td><span class="badge badge-purple">${item.cantidad} citas</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.statsManager = new StatsManager();
    });
} else {
    window.statsManager = new StatsManager();
}
