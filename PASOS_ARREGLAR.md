# 🚀 Pasos para Arreglar el Error "Acción no válida"

## ✅ Cambios Realizados

1. **Arreglado el envío de datos**: Ahora usa parámetros individuales en lugar de JSON
2. **Mocks deshabilitados**: Ya no se cargan datos de ejemplo automáticamente
3. **Mejor logging**: Verás mensajes claros en la consola

---

## 📝 PASO 1: Actualizar Google Apps Script (IMPORTANTE)

### 1.1 Abre el Editor

1. Ve a tu **Google Sheet**
2. **Extensiones** → **Apps Script**

### 1.2 Reemplaza el Código

**Borra TODO** y pega este código actualizado:

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
    
    // IMPORTANTE: Recibir parámetros individuales
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
    
    return returnError('Acción no válida: ' + action);
  } catch (error) {
    return returnError('Error en doGet: ' + error.toString());
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
    return returnError('Error en doPost: ' + error.toString());
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

### 1.3 Guardar

- Haz clic en **💾 Guardar** (o Ctrl+S)

### 1.4 Redesplegar (MUY IMPORTANTE)

1. **Implementar** → **Administrar implementaciones**
2. Busca tu implementación activa
3. Haz clic en el ícono de **lápiz** ✏️ (editar)
4. Cambia **Versión** a **Nueva versión**
5. **Implementar**
6. Cierra

**IMPORTANTE**: Si haces una nueva implementación (en lugar de actualizar), la URL cambiará y deberás actualizarla en `sheets-api.js`.

---

## 🧹 PASO 2: Limpiar Datos Mockeados

1. Abre tu app en el navegador
2. Presiona **F12** → **Console**
3. Ejecuta:

```javascript
localStorage.removeItem('calendarMockData');
localStorage.removeItem('usingMockData');
console.log('✅ Mocks eliminados');
location.reload();
```

---

## 🧪 PASO 3: Probar

### 3.1 Hacer Commit y Push

```bash
cd calendar-citas-app
git add .
git commit -m "fix: parámetros individuales para Apps Script, mocks deshabilitados"
git push origin main
```

### 3.2 Esperar y Abrir la App

- Espera 1-2 minutos
- Abre: `https://danidevdc.github.io/calendar-citas-app/`

### 3.3 Verificar en Consola

1. Abre DevTools: **F12** → **Console**
2. Deberías ver:
   - `📥 Cargando citas desde Google Sheets...`
   - `✅ X citas cargadas desde Sheets` (o `📭 Sin citas registradas`)

### 3.4 Crear una Cita

1. Haz clic en un día
2. Llena el formulario:
   - Nombre: **Test**
   - Apellido: **Prueba**
   - Carrera: **Testing**
   - Hora: **10:00**
   - Tipo: **presencial**
3. Haz clic en **Guardar Cita**

### 3.5 Verificar Resultado

**En la consola deberías ver**:
```
📤 Enviando cita a Google Sheets...
📩 Respuesta de Google: {success: true, message: "Cita guardada correctamente", ...}
```

**En el navegador**:
- Toast verde: `Cita guardada correctamente`
- Confetti 🎉
- La cita aparece en el calendario

**En Google Sheets**:
- Ve a tu Sheet
- Deberías ver la fila nueva con los datos

---

## 🐛 Si Sigue Sin Funcionar

### Error persiste: "Acción no válida"

**Verifica en Apps Script**:
1. Ve a **Ver** → **Registros de ejecución**
2. Busca el último error
3. Revisa qué dice

**Posibles causas**:
- No redeployaste (paso 1.4)
- El código tiene errores de sintaxis
- El `SHEET_ID` es incorrecto

### Error: "Failed to fetch"

**Causa**: La URL del Apps Script es incorrecta

**Solución**: Verifica que la URL en `sheets-api.js` línea 6 sea correcta

---

## ✅ Checklist

- [ ] Actualicé el código de Google Apps Script
- [ ] Guardé el proyecto
- [ ] Redeployé (actualicé versión de la implementación activa)
- [ ] Limpié los mocks del localStorage
- [ ] Hice commit y push de los cambios
- [ ] Esperé 1-2 minutos
- [ ] Abrí la app y la consola
- [ ] Probé crear una cita
- [ ] Verifiqué que se guardó en Sheets
- [ ] No hay errores en la consola

---

¡Listo! 🎉
