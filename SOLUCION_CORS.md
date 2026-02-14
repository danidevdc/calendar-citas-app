# 🔧 Solución al Error CORS

## ✅ Problemas Resueltos

1. **Error CORS**: Ahora usa GET en lugar de POST para evitar preflight requests
2. **Citas mockeadas**: Los datos de ejemplo ya no interfieren con datos reales
3. **Calendario semanal**: Ahora comienza en lunes y navega correctamente
4. **Mejor manejo de errores**: Logs más claros y mensajes informativos

---

## 📝 Pasos para Actualizar Google Apps Script

### 1. Abre el Editor de Apps Script

1. Ve a tu Google Sheet
2. **Extensiones** → **Apps Script**
3. Se abrirá el editor

### 2. Reemplaza TODO el Código

Borra todo el código actual y pega este:

```javascript
// ===== CONFIGURACIÓN =====
const SHEET_ID = '1THx5FOoMbZWd0QeflmCwmiwnKX5OVPdFp6y9T2HBzyk';
const SHEET_NAME = 'Citas';
const DATA_RANGE = 'A2:H1000';

// ===== MANEJAR PETICIONES GET (Leer y Escribir) =====
function doGet(e) {
  try {
    const action = e.parameter.action || 'getCitas';
    
    if (action === 'getCitas') {
      return getCitas();
    }
    
    // IMPORTANTE: Recibir parámetros individuales para evitar problemas con JSON
    if (action === 'saveCita') {
      const citaData = {
        paciente: e.parameter.paciente || '',
        apellido: e.parameter.apellido || '',
        carrera: e.parameter.carrera || '',
        fecha: e.parameter.fecha || '',
        hora: e.parameter.hora || '',
        duracion: parseInt(e.parameter.duracion) || 45,
        tipo: e.parameter.tipo || 'presencial',
        notas: e.parameter.notas || ''
      };
      return saveCita(citaData);
    }
    
    if (action === 'deleteCita') {
      const citaId = e.parameter.citaId;
      return deleteCita(citaId);
    }
    
    return returnError('Acción no válida');
  } catch (error) {
    return returnError(error.toString());
  }
}

// ===== MANEJAR PETICIONES POST (Respaldo) =====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'saveCita') {
      return saveCita(data.cita);
    }
    
    if (action === 'deleteCita') {
      return deleteCita(data.citaId);
    }
    
    return returnError('Acción no válida');
  } catch (error) {
    return returnError(error.toString());
  }
}

// ===== OBTENER TODAS LAS CITAS =====
function getCitas() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getRange(DATA_RANGE);
    const values = range.getValues();
    
    // Filtrar filas vacías
    const filteredValues = values.filter(row => row[0] !== '');
    
    return returnSuccess({
      values: filteredValues,
      count: filteredValues.length
    });
  } catch (error) {
    return returnError('Error al obtener citas: ' + error.toString());
  }
}

// ===== GUARDAR UNA CITA =====
function saveCita(cita) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Nueva fila con 8 columnas
    const newRow = [
      cita.paciente || '',
      cita.apellido || '',
      cita.carrera || '',
      cita.fecha || '',
      cita.hora || '',
      cita.duracion || 45,
      cita.tipo || 'presencial',
      cita.notas || ''
    ];
    
    // Agregar al final
    sheet.appendRow(newRow);
    
    return returnSuccess({
      message: 'Cita guardada correctamente',
      cita: cita
    });
  } catch (error) {
    return returnError('Error al guardar cita: ' + error.toString());
  }
}

// ===== ELIMINAR UNA CITA =====
function deleteCita(citaId) {
  try {
    return returnSuccess({
      message: 'Cita eliminada'
    });
  } catch (error) {
    return returnError('Error al eliminar cita: ' + error.toString());
  }
}

// ===== FUNCIONES DE UTILIDAD =====
function returnSuccess(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      ...data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function returnError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: message
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Guarda el Proyecto

Haz clic en el **icono de disco** o **Ctrl+S**

### 4. IMPORTANTE: Redespliega

**⚠️ MUY IMPORTANTE**: Debes crear una NUEVA implementación:

1. **Implementar** → **Nueva implementación**
2. Tipo: **Aplicación web**
3. Configuración:
   - **Descripción**: `Versión con solución CORS`
   - **Ejecutar como**: Yo
   - **Quién tiene acceso**: Cualquier persona
4. Haz clic en **Implementar**
5. **Copia la nueva URL**

### 5. Actualiza la URL en tu Código (OPCIONAL)

**Solo si la URL cambió**, actualiza en `sheets-api.js`:

```javascript
this.APPS_SCRIPT_URL = 'TU_NUEVA_URL_AQUI';
```

Si la URL es la misma que tenías, **no necesitas cambiar nada**.

---

## 🧪 Cómo Probar

### Prueba 1: Cargar Citas

1. Abre la consola del navegador: `F12` → **Console**
2. Recarga la página
3. Deberías ver: `📥 Cargando citas desde Google Sheets...`
4. Y luego: `✅ X citas cargadas desde Sheets`

### Prueba 2: Crear una Cita

1. Haz clic en un día del calendario
2. Llena el formulario
3. Haz clic en **Guardar Cita**
4. Deberías ver:
   - Un toast verde: `Cita guardada correctamente`
   - Confetti celebrando 🎉
   - La cita aparece en el calendario
5. Verifica en tu Google Sheet que la cita se guardó

### Prueba 3: Verificar Sin CORS

1. Abre **Network** en DevTools (F12)
2. Crea una cita
3. Busca la petición a `script.google.com`
4. **NO** debe aparecer ningún error CORS
5. Status debe ser `200 OK`

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Causa**: Google Apps Script no está desplegado o la URL es incorrecta

**Solución**:
1. Verifica que hayas desplegado el script
2. Verifica que la URL en `sheets-api.js` sea correcta
3. Intenta crear una NUEVA implementación

### Error: "success: false"

**Causa**: Error en el código de Apps Script

**Solución**:
1. Ve a Apps Script
2. **Ver** → **Registros de ejecución**
3. Revisa qué error apareció
4. Verifica que `SHEET_ID` y `SHEET_NAME` sean correctos

### Las citas mockeadas no desaparecen

**Solución**:
1. Abre la consola: `F12`
2. Ejecuta:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Esto limpiará todos los datos locales

### El calendario semanal sigue saltando semanas

**Solución**: Ya está arreglado en el código actualizado. Si persiste:
1. Limpia la caché del navegador
2. Recarga con `Ctrl+Shift+R`

---

## 📊 Mejoras Implementadas

### 1. Solución CORS

**Antes**: POST request → Preflight → CORS error  
**Ahora**: GET request → No preflight → ✅ Funciona

### 2. Manejo de Datos

**Antes**: Mocks siempre se cargan primero → Confusión  
**Ahora**: Solo carga mocks si no hay datos reales → ✅ Claro

### 3. Calendario Semanal

**Antes**: Comienza en domingo → Navegación confusa  
**Ahora**: Comienza en lunes → ✅ Más intuitivo

### 4. Logs y Errores

**Antes**: Mensajes genéricos  
**Ahora**: Logs con emojis y mensajes claros → ✅ Más fácil debug

---

## 🚀 Siguiente Nivel

Si quieres seguir mejorando la app:

1. **Implementar eliminación real** de citas (actualmente solo es local)
2. **Agregar edición** de citas existentes
3. **Mejorar autenticación** (hash más seguro)
4. **Agregar validación** de horarios (evitar overlap)
5. **Notificaciones** por email antes de las citas

¿Quieres que trabaje en alguna de estas?

---

## 📞 Soporte

Si algo no funciona:

1. **Revisa la consola**: `F12` → Console
2. **Revisa los logs de Apps Script**: Ver → Registros de ejecución
3. **Verifica la estructura del Sheet**: 8 columnas (A-H)
4. **Limpia localStorage**: `localStorage.clear()`
5. **Redespliega Apps Script**: Nueva implementación

---

## ✅ Checklist Final

- [ ] Actualicé el código de Google Apps Script
- [ ] Guardé el proyecto en Apps Script
- [ ] Creé una nueva implementación
- [ ] Copié la nueva URL (si cambió)
- [ ] Actualicé `sheets-api.js` (si fue necesario)
- [ ] Probé cargar citas
- [ ] Probé crear una nueva cita
- [ ] Verifiqué que se guardó en el Sheet
- [ ] No hay errores CORS en la consola
- [ ] El calendario navega correctamente

---

**¡Listo!** 🎉 Tu app debería funcionar perfectamente ahora.
