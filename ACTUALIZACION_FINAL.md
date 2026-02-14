# 🚀 Actualización Final - Eliminación Permanente

## ✅ Cambios Implementados

1. ✅ **Validación de fechas/horas** - No más crashes con datos inválidos
2. ✅ **No duplicar citas** - Editar ya no crea citas nuevas
3. ✅ **Eliminación permanente** - Ahora sí borra del Google Sheet

---

## 📝 PASO CRÍTICO: Actualizar Google Apps Script

### 1. Abre Google Apps Script

1. Ve a tu Google Sheet
2. **Extensiones** → **Apps Script**

### 2. Reemplaza TODO el Código

**Borra todo** y pega este código completo actualizado:

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
      const searchCriteria = {
        paciente: e.parameter.paciente,
        fecha: e.parameter.fecha,
        hora: e.parameter.hora
      };
      return deleteCita(searchCriteria);
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
function deleteCita(searchCriteria) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getRange(DATA_RANGE);
    const values = range.getValues();
    
    // Buscar la fila por nombre + fecha + hora
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === searchCriteria.paciente && 
          values[i][3] === searchCriteria.fecha && 
          values[i][4] === searchCriteria.hora) {
        rowIndex = i + 2; // +2 porque A2 es la primera fila de datos
        break;
      }
    }
    
    if (rowIndex === -1) {
      return returnError('Cita no encontrada para eliminar');
    }
    
    // Eliminar la fila
    sheet.deleteRow(rowIndex);
    
    return returnSuccess({
      message: 'Cita eliminada correctamente',
      rowIndex: rowIndex
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

### 3. Guardar y Redesplegar

1. **Guardar** (Ctrl+S)
2. **Implementar** → **Administrar implementaciones**
3. Click en el ícono **lápiz** ✏️ de tu implementación activa
4. **Versión** → **Nueva versión**
5. **Implementar**

---

## 🧪 Hacer Commit y Probar

### 1. Commit

```bash
git add .
git commit -m "feat: eliminación permanente en Sheets, validación de fechas"
git push origin main
```

### 2. Esperar

Espera 1-2 minutos para que GitHub Pages actualice.

### 3. Probar

1. Abre: `https://danidevdc.github.io/calendar-citas-app/`
2. Abre DevTools (`F12`) → **Console**

**Prueba Crear:**
- Crea una cita nueva
- Verifica en el Sheet que se agregó

**Prueba Eliminar:**
- Click en la cita
- Click en **Eliminar**
- Confirm
- Deberías ver: `✅ Cita eliminada de Google Sheets`
- Verifica en el Sheet que se borró la fila

**Prueba Editar:**
- Click en una cita
- Edita el nombre
- Guardar
- Verás: `✅ Cita actualizada (solo local)`
- Si recargas, vuelve al original (esto es esperado por ahora)

---

## ✅ Resumen de Funcionalidades

| Acción | Estado | Permanente |
|--------|--------|------------|
| ✅ Crear cita | Funciona | Sí - Se guarda en Sheets |
| ⚠️ Editar cita | Funciona | No - Solo local |
| ✅ Eliminar cita | Funciona | Sí - Borra del Sheet |
| ✅ Ver citas | Funciona | Sí - Carga desde Sheets |
| ✅ Validación | Funciona | N/A |

---

## 📋 Checklist Final

- [ ] Actualicé Google Apps Script con el código completo
- [ ] Guardé (Ctrl+S)
- [ ] Redeployé (EditarImplementación → Nueva versión)
- [ ] Hice commit y push
- [ ] Esperé 1-2 minutos
- [ ] Probé crear una cita → ✅ Se guardó en Sheets
- [ ] Probé eliminar una cita → ✅ Se borró del Sheet
- [ ] No hay errores en la consola

---

¡Ya casi está! 🎉 Solo falta implementar la edición permanente si la necesitas.
