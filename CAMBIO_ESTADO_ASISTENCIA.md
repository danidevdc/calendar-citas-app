# 📊 Cambio: Estado de Asistencia en lugar de Tipo de Sesión

## ✅ Cambios Implementados

Has solicitado cambiar el sistema de **Tipo de Sesión** (Presencial/Virtual/Telefónica) por **Estado de Asistencia** para llevar mejores estadísticas.

---

## 🎨 Nuevos Estados Disponibles

| Estado | Emoji | Color | Cuándo usar |
|--------|-------|-------|-------------|
| **Pendiente** | 🕒 | Morado | Cita agendada, aún no ha ocurrido |
| **Asistió** | ✅ | Verde | El paciente asistió a la cita |
| **No Asistió** | ❌ | Rojo | El paciente no asistió |
| **Reprogramó** | 🔄 | Amarillo | La cita fue reprogramada |

---

## 📝 PASO 1: Actualizar Google Sheet

### 1.1 Cambiar Encabezado de Columna G

1. Abre tu Google Sheet
2. En la celda **G1**, cambia el texto de `Tipo` a `Estado`

### 1.2 Actualizar Datos Existentes (Opcional)

Si tienes citas existentes, actualiza los valores de la columna G:

**Antes (valores viejos):**
- `presencial`
- `virtual`
- `telefonica`

**Ahora (nuevos valores):**
- `pendiente` (para citas futuras)
- `asistio` (si ya asistieron)
- `no-asistio` (si no asistieron)
- `reprogramo` (si se reprogramó)

**Sugerencia:** 
- Citas pasadas donde asistieron → `asistio`
- Citas futuras → `pendiente`

---

## 📝 PASO 2: Actualizar Google Apps Script

### 2.1 Abre el Editor

1. En tu Google Sheet: **Extensiones** → **Apps Script**

### 2.2 Busca y Reemplaza

**Busca esta línea (alrededor de la línea 48):**
```javascript
        estado: e.parameter.estado || 'pendiente',
```

**Si dice `tipo` en lugar de `estado`, reemplázala.**

**Busca también (alrededor de la línea 123):**
```javascript
      cita.estado || 'pendiente',
```

**Si dice `tipo`, cámbialo a `estado`.**

### 2.3 Código Completo Actualizado

Si quieres estar 100% seguro, **borra todo** y pega este código:

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
    
    if (action === 'saveCita') {
      const citaData = {
        paciente: e.parameter.paciente || '',
        apellido: e.parameter.apellido || '',
        carrera: e.parameter.carrera || '',
        fecha: e.parameter.fecha || '',
        hora: e.parameter.hora || '',
        duracion: parseInt(e.parameter.duracion) || 45,
        estado: e.parameter.estado || 'pendiente',
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

// ===== MANEJAR PETICIONES POST =====
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
    
    const newRow = [
      cita.paciente || '',
      cita.apellido || '',
      cita.carrera || '',
      cita.fecha || '',
      cita.hora || '',
      cita.duracion || 45,
      cita.estado || 'pendiente',
      cita.notas || ''
    ];
    
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
    
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === searchCriteria.paciente && 
          values[i][3] === searchCriteria.fecha && 
          values[i][4] === searchCriteria.hora) {
        rowIndex = i + 2;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return returnError('Cita no encontrada para eliminar');
    }
    
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

### 2.4 Guardar y Redesplegar

1. **Guardar** (Ctrl+S)
2. **Implementar** → **Administrar implementaciones**
3. Editar ✏️ la implementación activa
4. **Versión** → **Nueva versión**
5. **Implementar**

---

## 🚀 PASO 3: Deploy del Cliente

```bash
git add .
git commit -m "feat: cambio de tipo de sesión a estado de asistencia"
git push origin main
```

Espera 1-2 minutos para que GitHub Pages actualice.

---

## 🧪 PASO 4: Probar

### 4.1 Crear Nueva Cita

1. Abre tu app
2. Crea una cita nueva
3. Verás el nuevo selector: **Estado de Asistencia**
4. Por defecto aparece **Pendiente** 🕒
5. Guarda la cita
6. Verifica en tuelsheet que en la columna **G** dice `pendiente`

### 4.2 Ver Colores en el Calendario

Las citas ahora se ven con estos colores:

- 🟣 **Morado** = Pendiente
- 🟢 **Verde** = Asistió  
- 🔴 **Rojo** = No Asistió
- 🟡 **Amarillo** = Reprogramó

### 4.3 Actualizar Estado

1. Click en una cita
2. Cambia el estado a **Asistió** o **No Asistió**
3. Guardar
4. El color debería cambiar en el calendario

---

## 📊 Ventajas para Estadísticas

Con este cambio, ahora puedes:

### En Google Sheets:

**Contar asistencias:**
```
=COUNTIF(G:G,"asistio")
```

**Contar inasistencias:**
```
=COUNTIF(G:G,"no-asistio")
```

**Tasa de asistencia:**
```
=COUNTIF(G:G,"asistio")/(COUNTIF(G:G,"asistio")+COUNTIF(G:G,"no-asistio"))*100
```

**Citas pendientes:**
```
=COUNTIF(G:G,"pendiente")
```

**Reprogramaciones:**
```
=COUNTIF(G:G,"reprogramo")
```

---

## 📋 Estructura Final del Sheet

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Nombre** | **Apellido** | **Carrera** | **Fecha** | **Hora** | **Duración** | **Estado** | **Notas** |
| María | González | Psicología | 2026-02-14 | 09:00 | 45 | asistio | Primera sesión |
| Carlos | Rodríguez | Ingeniería | 2026-02-15 | 11:30 | 60 | pendiente | Seguimiento |
| Ana | Martínez | Medicina | 2026-02-13 | 10:00 | 45 | no-asistio | No dio aviso |

---

## ✅ Checklist Final

- [ ] Cambié el encabezado de G1 de "Tipo" a "Estado"
- [ ] Actualicé Google Apps Script con el código nuevo
- [ ] Guardé y redeployé (nueva versión)
- [ ] Hice commit y push del código cliente
- [ ] Esperé 1-2 minutos
- [ ] Probé crear una cita con estado "Pendiente"
- [ ] Verifiqué que se guardó correctamente en el Sheet
- [ ] Los colores del calendario cambian según el estado
- [ ] No hay errores en la consola

---

¡Listo! 🎉 Ahora puedes llevar estadísticas precisas de asistencia.
