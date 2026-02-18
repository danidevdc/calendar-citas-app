// ===== CONFIGURACIÓN DE SUPABASE =====

// 🔧 INSTRUCCIONES:
// 1. Ve a https://supabase.com y crea una cuenta
// 2. Crea un nuevo proyecto
// 3. Ve a Settings > API
// 4. Copia tu Project URL y anon/public key
// 5. Reemplaza los valores aquí abajo

const SUPABASE_URL = 'https://gowwjowsydxfvprwvtms.supabase.co'; // ej: https://xxxxx.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvd3dqb3dzeWR4ZnZwcnd2dG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjE1NDQsImV4cCI6MjA4Njk5NzU0NH0.yIbLDu77mPLD-_NhIcq3Mf4yhUkHIMdBEc7e6VGOFMk'; // ej: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ===== CLIENTE DE SUPABASE =====

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    // Método genérico para hacer requests
    async request(endpoint, options = {}) {
        const url = `${this.url}/rest/v1/${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            // Si es un DELETE sin contenido, retornar éxito
            if (response.status === 204) {
                return { success: true };
            }

            return await response.json();
        } catch (error) {
            console.error('Supabase request error:', error);
            throw error;
        }
    }

    // SELECT - Obtener todos los registros
    async select(table, options = {}) {
        let endpoint = table;
        const params = new URLSearchParams();

        // Filtros
        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                params.append(key, `eq.${value}`);
            });
        }

        // Ordenamiento
        if (options.order) {
            params.append('order', options.order);
        }

        // Límite
        if (options.limit) {
            params.append('limit', options.limit);
        }

        // Seleccionar columnas específicas
        if (options.select) {
            params.append('select', options.select);
        } else {
            params.append('select', '*');
        }

        const queryString = params.toString();
        if (queryString) {
            endpoint += `?${queryString}`;
        } else {
            endpoint += '?select=*';
        }

        return await this.request(endpoint, {
            method: 'GET'
        });
    }

    // INSERT - Insertar nuevo registro
    async insert(table, data) {
        return await this.request(table, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // UPDATE - Actualizar registro
    async update(table, id, data) {
        return await this.request(`${table}?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE - Eliminar registro
    async delete(table, id) {
        return await this.request(`${table}?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    // Consulta personalizada con filtros complejos
    async query(sql) {
        // Para queries SQL personalizadas, usar RPC functions
        // Ver: https://supabase.com/docs/guides/database/functions
        console.warn('Para queries complejas, usa RPC functions en Supabase');
    }
}

// ===== INICIALIZAR CLIENTE =====

// Verificar configuración
if (SUPABASE_URL === 'TU_PROJECT_URL_AQUI' || SUPABASE_KEY === 'TU_ANON_KEY_AQUI') {
    console.error('⚠️ SUPABASE NO CONFIGURADO');
    console.error('Por favor, edita js/supabase-config.js con tus credenciales');
    console.error('Instrucciones en: SETUP_SUPABASE.md');
}

// Exportar cliente global
window.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client inicializado');
