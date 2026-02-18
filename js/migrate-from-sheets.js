// ===== SCRIPT DE MIGRACIÓN: GOOGLE SHEETS → SUPABASE =====
// Este script te ayuda a migrar tus citas existentes de Google Sheets a Supabase

/**
 * INSTRUCCIONES:
 * 
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega todo este código
 * 3. Ejecuta: await migrarDesdeSheetsASupabase()
 * 4. Espera a que termine (puede tardar varios segundos)
 * 5. Recarga la página
 */

async function migrarDesdeSheetsASupabase() {
    console.log('🔄 Iniciando migración de Google Sheets a Supabase...');
    
    // Verificar que Supabase esté configurado
    if (!window.supabase) {
        console.error('❌ Error: Supabase no está configurado');
        console.error('Por favor, edita js/supabase-config.js con tus credenciales');
        return;
    }

    try {
        // ===== PASO 1: CARGAR DATOS DE GOOGLE SHEETS =====
        console.log('📥 Cargando datos de Google Sheets...');
        
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapD4fAZVsM6NZuw77pYwOfSBfve9zzk1dR9g-f8HWn0Z1Q21RMMQqlfsxUPT8PiHBGg/exec';
        
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getCitas`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Error al cargar datos: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.values || data.values.length === 0) {
            console.warn('⚠️ No hay datos en Google Sheets para migrar');
            return;
        }

        console.log(`✅ ${data.values.length} citas encontradas en Sheets`);

        // ===== PASO 2: CONVERTIR FORMATO =====
        console.log('🔄 Convirtiendo formato...');
        
        const citasConvertidas = data.values.map((row, index) => {
            // Formato esperado de Sheets:
            // [Paciente, Fecha, Hora, Duración, Tipo, Notas, ...]
            
            const paciente = row[0] || '';
            const fecha = row[1] || '';
            const hora = row[2] || '';
            const duracion = parseInt(row[3]) || 45;
            const tipo = row[4] || '';
            const notas = row[5] || '';

            // Separar nombre y apellido
            const nombreCompleto = paciente.trim().split(' ');
            const nombre = nombreCompleto[0] || '';
            const apellido = nombreCompleto.length > 1 ? nombreCompleto.slice(1).join(' ') : '';

            // Convertir fecha a formato ISO (YYYY-MM-DD)
            let fechaISO = fecha;
            if (fecha && fecha.includes('/')) {
                // Formato: DD/MM/YYYY o MM/DD/YYYY
                const partes = fecha.split('/');
                if (partes.length === 3) {
                    // Asumir DD/MM/YYYY
                    fechaISO = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                }
            }

            // Normalizar hora a formato HH:MM:SS
            let horaISO = hora;
            if (hora && !hora.includes(':')) {
                // Si es un número, asumir formato decimal de Excel
                const horaDecimal = parseFloat(hora);
                const horas = Math.floor(horaDecimal * 24);
                const minutos = Math.floor((horaDecimal * 24 - horas) * 60);
                horaISO = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:00`;
            } else if (hora && hora.split(':').length === 2) {
                horaISO = `${hora}:00`;
            }

            return {
                paciente: nombre,
                apellido: apellido,
                carrera: tipo,
                fecha: fechaISO,
                hora: horaISO,
                duracion: duracion,
                estado: 'pendiente', // Por defecto
                notas: notas,
                timestamp: Date.now() + index // Para evitar duplicados
            };
        });

        console.log(`✅ ${citasConvertidas.length} citas convertidas`);

        // ===== PASO 3: INSERTAR EN SUPABASE =====
        console.log('💾 Guardando en Supabase...');
        
        let exitosas = 0;
        let fallidas = 0;

        for (let i = 0; i < citasConvertidas.length; i++) {
            const cita = citasConvertidas[i];
            
            try {
                const result = await window.supabase.insert('citas1', cita);
                
                if (result && result.length > 0) {
                    exitosas++;
                    console.log(`✅ Cita ${i + 1}/${citasConvertidas.length} guardada`);
                } else {
                    fallidas++;
                    console.error(`❌ Error en cita ${i + 1}: No se pudo guardar`);
                }
            } catch (error) {
                fallidas++;
                console.error(`❌ Error en cita ${i + 1}:`, error.message);
            }

            // Pequeña pausa para no saturar la API
            if (i < citasConvertidas.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // ===== RESULTADO FINAL =====
        console.log('\n========================================');
        console.log('✅ MIGRACIÓN COMPLETADA');
        console.log('========================================');
        console.log(`✅ Exitosas: ${exitosas}`);
        console.log(`❌ Fallidas: ${fallidas}`);
        console.log(`📊 Total: ${citasConvertidas.length}`);
        console.log('========================================\n');

        if (exitosas > 0) {
            console.log('🎉 ¡Recarga la página para ver tus citas migradas!');
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        console.error('Detalles:', error.message);
    }
}

// ===== MIGRACIÓN MANUAL (DESDE CSV O ARRAY) =====

async function migrarDesdeArray(citasArray) {
    /**
     * Formato esperado del array:
     * [
     *   { paciente: 'Juan Pérez', fecha: '2026-02-20', hora: '14:00', duracion: 45, notas: '...' },
     *   ...
     * ]
     */
    
    console.log('🔄 Migrando desde array...');
    
    let exitosas = 0;
    let fallidas = 0;

    for (let i = 0; i < citasArray.length; i++) {
        const cita = citasArray[i];
        
        // Completar campos faltantes
        const citaCompleta = {
            paciente: cita.paciente || '',
            apellido: cita.apellido || '',
            carrera: cita.carrera || '',
            fecha: cita.fecha || '',
            hora: cita.hora.includes(':') ? cita.hora : `${cita.hora}:00`,
            duracion: cita.duracion || 45,
            estado: cita.estado || 'pendiente',
            notas: cita.notas || '',
            timestamp: Date.now() + i
        };

        try {
            const result = await window.supabase.insert('citas1', cita);
            
            if (result && result.length > 0) {
                exitosas++;
                console.log(`✅ Cita ${i + 1}/${citasArray.length} guardada`);
            } else {
                fallidas++;
            }
        } catch (error) {
            fallidas++;
            console.error(`❌ Error en cita ${i + 1}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Migración completada: ${exitosas} exitosas, ${fallidas} fallidas`);
}

// ===== EJEMPLO DE USO =====

// Para migrar desde Google Sheets:
// await migrarDesdeSheetsASupabase()

// Para migrar desde un array manualmente:
/*
const misCitas = [
    { 
        paciente: 'Juan',
        apellido: 'Pérez',
        carrera: 'Ingeniería',
        fecha: '2026-02-20',
        hora: '14:00',
        duracion: 45,
        estado: 'pendiente',
        notas: 'Primera sesión'
    },
    // ... más citas
];

await migrarDesdeArray(misCitas);
*/

console.log('✅ Script de migración cargado');
console.log('Ejecuta: await migrarDesdeSheetsASupabase()');
