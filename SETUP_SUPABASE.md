# 🚀 Migración a Supabase

## ¿Por qué Supabase?
- ✅ Base de datos PostgreSQL gratis (500MB)
- ✅ API REST automática
- ✅ Sincronización entre dispositivos
- ✅ Panel de administración incluido
- ✅ 50,000 usuarios activos/mes gratis

---

## 📝 Paso 1: Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Click en **"Start your project"**
3. Crea una cuenta con GitHub o email
4. Click en **"New Project"**
5. Rellena:
   - **Name**: `calendario-citas` (o el nombre que quieras)
   - **Database Password**: **¡GUARDA ESTA CONTRASEÑA!** 
   - **Region**: Elige la más cercana (ej: South America)
6. Click **"Create new project"** (tarda ~2 minutos)

---

## 🔧 Paso 2: Crear la Tabla de Citas

1. En el panel de Supabase, ve a **"Table Editor"** (icono de tabla)
2. Click **"Create a new table"**
3. Configura:
   - **Name**: `citas1`
   - **Enable Row Level Security (RLS)**: ✅ ACTIVAR (por seguridad)
4. Agrega las siguientes columnas (click "+"):

| Nombre       | Tipo       | Configuración                    |
|-------------|------------|----------------------------------|
| `id`        | `int8`     | ✅ Primary, Auto-increment      |
| `created_at`| `timestamp`| Default: `now()`                 |
| `paciente`  | `text`     | -                                |
| `apellido`  | `text`     | Default: `''`                    |
| `carrera`   | `text`     | Default: `''`                    |
| `fecha`     | `date`     | -                                |
| `hora`      | `time`     | -                                |
| `duracion`  | `int4`     | Default: `45`                    |
| `estado`    | `text`     | Default: `'pendiente'`           |
| `notas`     | `text`     | Default: `''`                    |
| `timestamp` | `int8`     | Nullable ✅ (sin default)        |

5. Click **"Save"**

---

## 🔐 Paso 3: Configurar Políticas de Seguridad (RLS)

1. Ve a **"Authentication"** > **"Policies"** en el menú
2. Selecciona la tabla `citas1`
3. Click **"New Policy"**
4. Configuración:
   - **Policy name**: `Allow all operations`
   - **Allowed operation**: `All`
   - **Target roles**: `anon` (usuario anónimo)
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
5. Click **"Review"** > **"Save policy"**

> ⚠️ **Nota de Seguridad**: Esta política permite todas las operaciones sin autenticación. 
> Si quieres más seguridad, puedes agregar autenticación con email/contraseña después.

---

## 🔑 Paso 4: Obtener las Credenciales

1. Ve a **"Settings"** (icono de engranaje) > **"API"**
2. Copia estos valores:

```
Project URL: https://xxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Guarda estos valores para el siguiente paso

---

## 📝 Paso 5: Configurar tu Aplicación

Abre el archivo `js/supabase-config.js` (ya está creado) y reemplaza:

```javascript
const SUPABASE_URL = 'TU_PROJECT_URL_AQUI';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI';
```

Con tus credenciales reales.

---

## 🎉 ¡Listo!

Tu aplicación ahora usará Supabase en lugar de Google Sheets.

**Ventajas:**
- ✅ Sincronización automática entre dispositivos
- ✅ Más rápido que Sheets
- ✅ Sin límites de API
- ✅ Panel de administración profesional

**Para ver tus datos:**
- Ve a Supabase > Table Editor > `citas1`
- Puedes editar, agregar o eliminar citas directamente

**Estadísticas:**
- Abre `stats.html` en tu navegador
- Verás gráficas de tus citas, horas más ocupadas y tasa de asistencia

---

## 📊 Migrar Datos Existentes (Opcional)

Si tienes citas en Google Sheets que quieres migrar:

1. Ve a Supabase > Table Editor > `citas1`
2. Click en **"Insert"** > **"Insert row"**
3. O usa el script de migración: `js/migrate-from-sheets.js`

---

## 🆘 Soporte

- Documentación: [https://supabase.com/docs](https://supabase.com/docs)
- Dashboard Supabase: [https://app.supabase.com](https://app.supabase.com)
