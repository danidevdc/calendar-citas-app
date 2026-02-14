# 🧹 Limpiar Datos Mockeados

## Opción 1: Desde la Consola del Navegador

1. Abre tu app en el navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Pega y ejecuta este código:

```javascript
// Limpiar todos los mocks
localStorage.removeItem('calendarMockData');
localStorage.removeItem('usingMockData');
console.log('✅ Datos mockeados eliminados');
location.reload();
```

## Opción 2: Limpiar Todo el localStorage

Si quieres limpiar TODOS los datos locales (incluida la sesión de login):

```javascript
localStorage.clear();
console.log('✅ Todo el localStorage limpiado');
location.reload();
```

## Opción 3: Desde Application Tab

1. Abre DevTools (**F12**)
2. Ve a la pestaña **Application**
3. En el panel izquierdo: **Storage** → **Local Storage** → Tu dominio
4. Busca y elimina:
   - `calendarMockData`
   - `usingMockData`
5. Recarga la página

---

## ✅ Verificar que se Limpiaron

Después de limpiar, ejecuta en la consola:

```javascript
console.log('calendarMockData:', localStorage.getItem('calendarMockData'));
console.log('usingMockData:', localStorage.getItem('usingMockData'));
```

Deberías ver `null` en ambos.

---

## 🔧 Los Mocks Están Deshabilitados

Ya actualicé el código para que **NO cargue mocks automáticamente**. Ahora la app solo usará datos reales de Google Sheets.

Si no hay datos en Sheets, verás un calendario vacío (sin mocks).
