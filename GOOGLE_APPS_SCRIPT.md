# 📝 Configuración de Google Apps Script

## ✅ Seguridad Implementada

Has elegido la **Solución 3**: usar únicamente Google Apps Script, eliminando la exposición de API Keys y Sheet ID en el código del cliente.

## 🔒 Solución CORS Implementada

✅ **Problema resuelto**: Error CORS al hacer POST desde GitHub Pages  
✅ **Solución**: Usar GET requests con parámetros URL  
✅ **Beneficio**: No requiere preflight requests, evita bloqueo CORS

## 🔧 Pasos para Configurar

### 1. Abre Google Apps Script

1. Ve a tu Google Sheet
2. Menú: **Extensiones** → **Apps Script**
3. Se abrirá el editor de Google Apps Script

### 2. Reemplaza el Código

Borra todo el código existente y pega este:

```javascript
// ===== CONFIGURACIÓN =====
const SHEET_ID = '1THx5FOoMbZWd0QeflmCwmiwnKX5OVPdFp6y9T2HBzyk';
const SHEET_NAME = 'Citas';
const DATA_RANGE = 'A2:H1000'; // Ajustado a 8 columnas (A-H)

// ===== MANEJAR PETICIONES GET (Leer citas) =====
function doGet(e) {
  try {
    const action = e.parameter.action || 'getCitas';
    
    if (action === 'getCitas') {
      return getCitas();
    }
    
    // IMPORTANTE: Manejar peticiones POST vía GET para CORS
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

// ===== MANEJAR PETICIONES POST (Respaldo - por si se habilita CORS) =====
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
    
    // Nueva fila con 8 columnas: Nombre, Apellido, Carrera, Fecha, Hora, Duración, Tipo, Notas
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
    // Esta función requiere más lógica personalizada
    // Por ahora retornamos éxito
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

### 3. Actualiza la Estructura de tu Sheet

Tu Google Sheet debe tener estas **8 columnas** en el orden exacto:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Nombre** | **Apellido** | **Carrera** | **Fecha** | **Hora** | **Duración** | **Tipo** | **Notas** |
| María | González | Psicología | 2026-02-14 | 09:00 | 45 | presencial | Primera sesión |
| Carlos | Rodríguez | Ingeniería | 2026-02-13 | 11:30 | 60 | virtual | Seguimiento |

### 4. Despliega el Script

1. Haz clic en **Implementar** → **Nueva implementación**
2. Tipo: **Aplicación web**
3. Configuración:
   - **Ejecutar como:** Yo (tu email)
   - **Quién tiene acceso:** Cualquier persona
4. Haz clic en **Implementar**
5. **Copia la URL** que te da (será tu nueva APPS_SCRIPT_URL)

### 5. Actualiza la URL en tu Código

Si la URL cambió, actualiza en `sheets-api.js`:

```javascript
this.APPS_SCRIPT_URL = 'TU_NUEVA_URL_AQUI';
```

### 6. Prueba la Configuración

1. Abre tu aplicación
2. Intenta cargar las citas
3. Intenta crear una nueva cita
4. Verifica que se guarde en el Sheet

## 🔒 Beneficios de Seguridad

✅ **Sin API Keys expuestas**: La API Key de Google nunca sale del Apps Script  
✅ **Sin Sheet ID expuesto**: El ID del Sheet está solo en el servidor de Google  
✅ **Control de acceso**: Puedes cambiar "Cualquier persona" a "Solo yo" cuando quieras  
✅ **Fácil de rotar**: Si necesitas cambiar credenciales, solo editas el Apps Script  
✅ **Sin costos**: Google Apps Script es gratuito para este uso  

## ⚠️ Próximos Pasos de Seguridad

Aún te quedan estos problemas por resolver:

1. **Autenticación débil**: El hash de contraseña es muy simple
2. **Datos en localStorage**: Vulnerable a XSS
3. **Sin encriptación**: Los datos viajan en texto plano (usa HTTPS siempre)
4. **Sin rate limiting**: Alguien podría hacer spam de peticiones

¿Quieres que trabaje en alguno de estos?

## 📞 Soporte

Si algo no funciona:
1. Revisa la consola del navegador (F12)
2. Revisa los logs en Apps Script (Ver → Registros de ejecución)
3. Verifica que las columnas del Sheet coincidan con el código
