# 🚀 Migración de Google Sheets a Supabase

## ✅ Cambios Realizados

Tu aplicación de calendario de citas ha sido migrada completamente de **Google Sheets** a **Supabase**, una base de datos PostgreSQL moderna, rápida y gratuita.

---

## 🎯 ¿Por qué Supabase?

| Característica | Google Sheets | Supabase |
|---------------|---------------|----------|
| **Velocidad** | Lento (APIs limitadas) | ⚡ Muy rápido |
| **Sincronización** | Manual (cada 5 min) | ⚡ Automática en tiempo real |
| **Límites de API** | 100 req/100 seg | 🚀 Ilimitado (plan gratis) |
| **Datos** | Limitado a Sheets | 500MB base de datos |
| **Fiabilidad** | Depende de Google Apps Script | ✅ Base de datos profesional |
| **Multi-dispositivo** | ✅ Sí | ✅ Sí |
| **Costo** | Gratis | 🆓 Gratis |

---

## 📦 Archivos Nuevos

### Nuevos Archivos Creados:
- `js/supabase-config.js` - Configuración de Supabase
- `js/supabase-api.js` - API Manager para Supabase
- `js/stats.js` - Gestor de estadísticas
- `stats.html` - Página de estadísticas con gráficas
- `SETUP_SUPABASE.md` - Guía completa de configuración

### Archivos Modificados:
- `index.html` - Actualizado para usar Supabase en lugar de Sheets
- *(calendar.js, auth.js, etc. permanecen iguales)*

### Archivos Obsoletos (ya no se usan):
- `js/sheets-api.js` - ❌ Reemplazado por supabase-api.js
- Scripts de Google Apps Script - ❌ Ya no son necesarios

---

## 🔧 Configuración (Paso a Paso)

### 1. Crear Cuenta en Supabase

1. Ve a **[https://supabase.com](https://supabase.com)**
2. Click en **"Start your project"**
3. Regístrate con GitHub o email (gratis)
4. Crea un nuevo proyecto:
   - **Name**: `calendario-citas` (o el que prefieras)
   - **Database Password**: ⚠️ **GUÁRDALA BIEN** (la necesitarás)
   - **Region**: Elige South America (o la más cercana)
5. Click en **"Create new project"** (tarda ~2 minutos)

### 2. Crear la Tabla de Datos

Una vez creado el proyecto:

1. Ve a **"Table Editor"** (icono de tabla en el menú)
2. Click **"Create a new table"**
3. Configura:
   - **Name**: `citas`
   - **Enable Row Level Security (RLS)**: ✅ **ACTIVAR**

4. Agrega estas columnas (click en "+" para cada una):

| Nombre | Tipo | Configuración |
|--------|------|---------------|
| `id` | `int8` | ✅ Primary Key, Auto-increment |
| `created_at` | `timestamp` | Default: `now()` |
| `paciente` | `text` | - |
| `apellido` | `text` | Default: `''` |
| `carrera` | `text` | Default: `''` |
| `fecha` | `date` | - |
| `hora` | `time` | - |
| `duracion` | `int4` | Default: `45` |
| `estado` | `text` | Default: `'pendiente'` |
| `notas` | `text` | Default: `''` |
| `timestamp` | `int8` | Nullable ✅ (sin default) |

5. Click **"Save"**

### 3. Configurar Permisos (RLS)

1. Ve a **"Authentication"** > **"Policies"**
2. Selecciona la tabla `citas`
3. Click **"New Policy"**
4. Llena:
   - **Policy name**: `Allow all operations`
   - **Allowed operation**: `All`
   - **Target roles**: `anon`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
5. Click **"Review"** > **"Save policy"**

### 4. Obtener tus Credenciales

1. Ve a **"Settings"** (icono de engranaje) > **"API"**
2. Copia estos 2 valores:

```
📌 Project URL: https://xxxxx.supabase.co
📌 anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Configurar tu Aplicación

Abre el archivo `js/supabase-config.js` y pega tus credenciales:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // 👈 Tu URL aquí
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 👈 Tu key aquí
```

### 6. ¡Listo! 🎉

Abre `index.html` en tu navegador y tu aplicación ahora usará Supabase.

---

## 📊 Nueva Funcionalidad: Estadísticas

### ¿Qué Incluye?

- ✅ **Citas por mes**: Gráfica de barras con historial
- ✅ **Horas más ocupadas**: Gráfica circular con tus horarios pico
- ✅ **Tasa de asistencia**: Porcentaje de pacientes que asisten
- ✅ **Pacientes frecuentes**: Top 10 de pacientes con más citas

### Cómo Verlas:

1. Abre tu calendario (`index.html`)
2. Click en el botón **"📊 Estadísticas"** (arriba a la derecha)
3. Se abrirá `stats.html` con todas las métricas

O directamente abre `stats.html` en tu navegador.

---

## 🔄 Migrar Datos Existentes (Opcional)

Si tienes citas en Google Sheets que quieres mantener:

### Opción 1: Manual (Recomendado para pocas citas)

1. Ve a Supabase > Table Editor > `citas`
2. Click en **"Insert row"**
3. Llena los campos y guarda

### Opción 2: Exportación desde Sheets

1. Abre tu hoja de Google Sheets
2. Descarga como CSV
3. Ve a Supabase > Table Editor > `citas` > **"Import data"**
4. Sube el CSV

---

## 🆕 ¿Qué Mejoró?

### Antes (Google Sheets):
- ⏱️ Sincronización cada 5 minutos
- 🐌 Lento al cargar citas
- ⚠️ Límites de API (100 req/100 seg)
- 🔧 Configuración compleja (Apps Script, OAuth)
- ❌ Errores frecuentes de CORS

### Ahora (Supabase):
- ⚡ Sincronización instantánea
- 🚀 Carga ultra-rápida
- ✅ Sin límites prácticos
- 🎯 Setup en 10 minutos
- ✅ Sin problemas de CORS

---

## 🛠️ Panel de Administración

Puedes gestionar tus citas directamente desde Supabase:

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **"Table Editor"** > `citas`
4. Puedes:
   - Ver todas las citas
   - Editar cualquier campo
   - Eliminar citas
   - Exportar a CSV
   - Ver estadísticas de uso

---

## 📱 Uso Multi-Dispositivo

Ahora puedes acceder desde cualquier dispositivo:

1. Sube tu carpeta a un servidor (GitHub Pages, Netlify, Vercel, etc.)
2. O comparte la carpeta en Google Drive / Dropbox
3. Todos los cambios se sincronizan automáticamente

---

## 🆘 Solución de Problemas

### ❌ "Supabase no configurado"
- Revisa que hayas pegado correctamente las credenciales en `js/supabase-config.js`
- Verifica que el URL y la Key no tengan espacios adicionales

### ❌ "Error 401 Unauthorized"
- Ve a Supabase > Authentication > Policies
- Asegúrate de haber creado la política `Allow all operations`

### ❌ "No se cargan las citas"
- Abre la consola del navegador (F12)
- Revisa si hay errores en rojo
- Verifica que la tabla se llame exactamente `citas` (minúsculas)

### ❌ "Las estadísticas están en blanco"
- Asegúrate de tener al menos algunas citas guardadas
- Refresca la página de estadísticas

---

## 📚 Recursos

- **Documentación Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Dashboard Supabase**: [https://app.supabase.com](https://app.supabase.com)
- **Chart.js (Gráficas)**: [https://www.chartjs.org/](https://www.chartjs.org/)

---

## 🎓 Para Desarrolladores

### Estructura del Proyecto

```
calendar-citas-app/
├── index.html              # Calendario principal
├── stats.html              # Página de estadísticas
├── css/
│   └── styles.css          # Estilos
├── js/
│   ├── auth.js             # Autenticación con contraseña
│   ├── calendar.js         # Gestor del calendario (FullCalendar)
│   ├── confetti.js         # Animaciones de confeti
│   ├── holidays.js         # Gestión de feriados
│   ├── supabase-config.js  # ⭐ Config de Supabase
│   ├── supabase-api.js     # ⭐ API Manager
│   └── stats.js            # ⭐ Gestor de estadísticas
└── SETUP_SUPABASE.md       # Guía completa
```

### Arquitectura

```
┌─────────────┐
│  index.html │ ──┐
└─────────────┘   │
                  ├──> supabase-config.js ──> Supabase DB
┌─────────────┐   │         ▲
│ stats.html  │ ──┘         │
└─────────────┘             │
                   supabase-api.js
```

### APIs Disponibles

```javascript
// Obtener todas las citas
await window.sheetsAPI.loadCitas();

// Guardar nueva cita
await window.sheetsAPI.saveCita(citaData);

// Actualizar cita existente
await window.sheetsAPI.updateCita(id, citaData);

// Eliminar cita
await window.sheetsAPI.deleteCita(id);

// Obtener estadísticas
const stats = await window.sheetsAPI.getStats();
```

---

## 🚀 Siguientes Pasos (Opcional)

### Mejoras Futuras que Puedes Implementar:

1. **Autenticación de usuarios**
   - Supabase Auth (email/password)
   - Acceso multi-usuario

2. **Notificaciones**
   - Recordatorios de citas por email
   - WhatsApp API

3. **Exportación**
   - Generar PDFs de reportes
   - Exportar a Excel

4. **Backup automático**
   - Descargar CSV periódicamente
   - Sincronización con Google Drive

---

¿Necesitas ayuda? Revisa `SETUP_SUPABASE.md` para más detalles. 🚀
