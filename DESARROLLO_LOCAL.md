# Desarrollo Local - Solucionar CORS

## El Problema
Cuando usas Live Server desde localhost, Google Apps Script bloquea las peticiones por políticas de CORS.

## Solución: Modificar tu Apps Script

Ve a tu proyecto de Google Apps Script y modifica el código para incluir headers CORS:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Tu lógica actual...
    
    const result = {
      success: true,
      message: 'Cita guardada correctamente'
    };
    
    // IMPORTANTE: Agregar headers CORS
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')  // ← AÑADE ESTO
      .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')  // ← AÑADE ESTO
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');  // ← AÑADE ESTO
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')  // ← AÑADE ESTO también en error
      .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

// Manejar peticiones OPTIONS (preflight de CORS)
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**IMPORTANTE:** Después de modificar el código:
1. Guarda el proyecto
2. **Despliega una NUEVA versión** (Implementar > Nueva implementación)
3. Usa la nueva URL en tu `sheets-api.js`

⚠️ **NOTA DE SEGURIDAD:** En producción (GitHub Pages), considera cambiar `'*'` por tu dominio específico: `'https://tuusuario.github.io'`

## Opción 3: Extensión de Navegador (Rápido pero temporal)

Instala una extensión para desactivar CORS durante desarrollo:
- Chrome: "CORS Unblock" o "Allow CORS"
- Firefox: "CORS Everywhere"

⚠️ **Recuerda desactivarla después del desarrollo**

## Recomendación Final

Para pruebas rápidas: **Usa GitHub Pages**. Es más rápido que configurar CORS y funciona exactamente como en producción.
