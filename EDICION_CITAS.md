# ⚠️ Edición de Citas - Limitación Actual

## 🔧 Cómo Funciona Ahora

### ✅ Crear Nueva Cita
Cuando **creas una nueva cita**:
- Se guarda en Google Sheets permanentemente ✅
- Aparece en el calendario ✅
- Persiste después de recargar ✅

### ⚠️ Editar Cita Existente
Cuando **editas una cita**:
- Se actualiza en el calendario ✅
- La ves actualizada inmediatamente ✅
- **PERO**: La edición es **solo local** ⚠️
- Si recargas la página, vuelve a la versión original del Sheet ❌

---

## 🤔 ¿Por Qué Esta Limitación?

Google Apps Script hace fácil **agregar nuevas filas** con `appendRow()`, pero **actualizar filas específicas** requiere:
1. Encontrar qué fila del Sheet corresponde a esa cita
2. Actualizar solo esa fila
3. Mantener un índice o identificador único

Esto es más complejo y requiere más código en Google Apps Script.

---

## ✅ Solución Temporal

**Por ahora, si necesitas editar una cita:**

### Opción 1: Editar Directamente en el Sheet
1. Abre tu Google Sheet
2. Encuentra la fila de la cita
3. Edita los datos directamente
4. Recarga la app

### Opción 2: Borrar y Recrear
1. Borra la cita vieja (botón eliminar en el modal)
2. Crea una nueva cita con los datos correctos

---

## 🚀 Implementación Futura (Opcional)

Si quieres habilitar la edición permanente, necesitas:

### 1. Modificar Google Apps Script

Agregar esta función:

```javascript
// ===== ACTUALIZAR UNA CITA =====
function updateCita(searchCriteria, newData) {
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
      return returnError('Cita no encontrada para actualizar');
    }
    
    // Actualizar la fila
    const updatedRow = [
      newData.paciente || '',
      newData.apellido || '',
      newData.carrera || '',
      newData.fecha || '',
      newData.hora || '',
      newData.duracion || 45,
      newData.tipo || 'presencial',
      newData.notas || ''
    ];
    
    sheet.getRange(rowIndex, 1, 1, 8).setValues([updatedRow]);
    
    return returnSuccess({
      message: 'Cita actualizada correctamente',
      rowIndex: rowIndex
    });
  } catch (error) {
    return returnError('Error al actualizar cita: ' + error.toString());
  }
}
```

Y modificar `doGet`:

```javascript
if (action === 'updateCita') {
  const searchCriteria = {
    paciente: e.parameter.oldPaciente,
    fecha: e.parameter.oldFecha,
    hora: e.parameter.oldHora
  };
  
  const newData = {
    paciente: e.parameter.paciente || '',
    apellido: e.parameter.apellido || '',
    carrera: e.parameter.carrera || '',
    fecha: e.parameter.fecha || '',
    hora: e.parameter.hora || '',
    duracion: parseInt(e.parameter.duracion) || 45,
    tipo: e.parameter.tipo || 'presencial',
    notas: e.parameter.notas || ''
  };
  
  return updateCita(searchCriteria, newData);
}
```

### 2. Modificar sheets-api.js

Cambiar la parte de edición para enviar los datos viejos también:

```javascript
if (isEditing) {
    // Guardar datos viejos para buscar la fila
    const oldCita = this.citas.find(c => c.id === cita.id);
    
    const params = new URLSearchParams({
        action: 'updateCita',
        oldPaciente: oldCita.paciente,
        oldFecha: oldCita.fecha,
        oldHora: oldCita.hora,
        paciente: cita.paciente || '',
        apellido: cita.apellido || '',
        // ... resto de campos
    });
    
    const url = `${this.APPS_SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    // ... procesar respuesta
}
```

---

## 📊 Alternativa: Usar ID Único en el Sheet

Una mejor solución sería:

1. Agregar una columna "ID" al Sheet (columna I)
2. Generar IDs únicos al crear citas
3. Buscar por ID en lugar de por nombre+fecha+hora

Esto hace la búsqueda más confiable.

---

## ✅ Estado Actual

Por ahora, la app funciona así:

- ✅ **Crear citas**: Funciona perfectamente, se guarda en Sheets
- ⚠️ **Editar citas**: Solo actualiza localmente (no persiste)
- ✅ **Eliminar citas**: Elimina localmente (no persiste)
- ✅ **Ver citas**: Carga desde Sheets correctamente

---

## 🎯 Recomendación

Para uso básico, la app funciona bien. Si necesitas editar/eliminar citas frecuentemente:

1. **Opción simple**: Edita directo en el Google Sheet
2. **Opción completa**: Implementa la función de actualización siguiendo la guía arriba

¿Quieres que implemente la edición permanente? Tomaría unos minutos más.
