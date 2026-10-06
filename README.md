# 📅 Gestor de Citas - Consulta Psicológica

Aplicación web para gestionar citas de pacientes con sincronización a Google Sheets, vistas de calendario (mes/semana) y sistema de autenticación.

## English overview

A web application for scheduling appointments, with month and week calendar views, configurable non-working days and Google Sheets integration.

**Technologies:** HTML, CSS, JavaScript and Google Apps Script.

**Portfolio focus:** calendar workflows, appointment organization and spreadsheet integration.

## ✨ Características

- 📆 **Vistas de Calendario**: Mes y semana
- 🔐 **Autenticación**: Contraseña personalizada
- 📊 **Integración Google Sheets**: Sincronización automática
- 🎯 **Días Feriados**: Sistema configurable de días no laborables
- 💅 **Interfaz Moderna**: Diseño responsivo y atractivo
- 🚀 **Deploy en GitHub Pages**: Hosting gratuito
- 📱 **Responsive**: Funciona en móvil, tablet y desktop

## 🚀 Setup Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/danidevdc/calendar-citas-app.git
cd calendar-citas-app
```

### 2. Configurar Google Sheets

#### a) Crear una hoja de cálculo:
- Ve a [Google Sheets](https://sheets.google.com)
- Crea una nueva hoja llamada "Citas"
- Agrega headers en la primera fila:
  ```
  Paciente | Fecha | Hora | Duración | Tipo | Notas
  ```

#### b) Obtener Sheet ID:
- De la URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_AQUI/edit`
- Copia el `SHEET_ID_AQUI`

#### c) Crear API Key:
- Ve a [Google Cloud Console](https://console.cloud.google.com)
- Crea un nuevo proyecto
- Habilita "Google Sheets API"
- Ve a "Credenciales"
- Crea una "API Key"

### 3. Configurar Google Apps Script (Recomendado)

Para guardar citas automáticamente:

- Ve a [Google Apps Script](https://script.google.com)
- Crea un nuevo proyecto
- Reemplaza el contenido con el siguiente código:

```javascript
const SHEET_ID = 'TU_SHEET_ID_AQUI';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveCita') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Citas');
      const cita = data.cita;
      
      sheet.appendRow([
        cita.paciente,
        cita.fecha,
        cita.hora,
        cita.duracion,
        cita.tipo,
        cita.notas
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Cita guardada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

- Haz clic en "Desplegar" > "Nuevo despliegue"
- Selecciona "Aplicación web"
- Ejecutar como: Tu cuenta
- Quien tiene acceso: Cualquier persona
- Copia el URL generado

### 4. Actualizar Credenciales

En `js/sheets-api.js`, reemplaza:

```javascript
this.SHEET_ID = 'TU_SHEET_ID_AQUI';
this.API_KEY = 'TU_API_KEY_AQUI';
this.APPS_SCRIPT_URL = 'TU_APPS_SCRIPT_URL_AQUI';
```

### 5. Deploy a GitHub Pages

1. Sube los cambios a tu repositorio
2. Ve a **Settings** > **Pages**
3. Selecciona **Deploy from a branch**
4. Elige **main** como rama
5. ¡Listo! Tu app estará disponible en `https://danidevdc.github.io/calendar-citas-app`

## 🔒 Seguridad

- La contraseña se hashea y se almacena en `localStorage`
- Primera contraseña que ingreses será la contraseña maestra
- Considera usar HTTPS (GitHub Pages usa HTTPS por defecto)

**⚠️ Importante**: Para datos médicos sensibles:
- Implementa autenticación OAuth
- Usa encriptación para datos en tránsito
- Cumple con regulaciones LGPD/GDPR

## 📁 Estructura del Proyecto

```
calendar-citas-app/
├── index.html                    # HTML principal
├── CONFIGURACION_FERIADOS.md     # Guía de configuración de feriados
├── README.md                     # Este archivo
├── css/
│   └── styles.css                # Estilos
├── js/
│   ├── auth.js                   # Sistema de autenticación
│   ├── sheets-api.js             # Integración Google Sheets
│   ├── holidays.js               # Gestión de días feriados
│   └── calendar.js               # Lógica del calendario
└── .gitignore                    # Archivos a ignorar
```

## 🎨 Personalización

### Configurar Días Feriados

Para marcar días no laborables en el calendario:

1. **Edita** `js/holidays.js`
2. **Agrega fechas** en dos formatos:
   - `MM-DD` para feriados anuales (ej: `'12-25'` para Navidad)
   - `YYYY-MM-DD` para fechas específicas (ej: `'2026-03-15'`)

```javascript
const HOLIDAYS = [
    '01-01',  // Año Nuevo
    '12-25',  // Navidad
    '2026-07-04',  // Fecha específica
];
```

📖 **Guía completa**: Ver [CONFIGURACION_FERIADOS.md](CONFIGURACION_FERIADOS.md)

### Cambiar Colores

En `css/styles.css`:

```css
:root {
    --primary: #6366f1;      /* Color principal */
    --success: #10b981;      /* Color de éxito */
    --danger: #ef4444;       /* Color de peligro */
    /* ... más variables */
}
```

### Modificar Vistas

En `js/calendar.js`:

```javascript
// Agregar más tipos de sesión
getColorByType(tipo) {
    const colors = {
        presencial: '#667eea',
        virtual: '#f5576c',
        telefonica: '#4facfe',
        nuevaTipo: '#yourcolor'
    };
    return colors[tipo] || colors.presencial;
}
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un [Issue](https://github.com/danidevdc/calendar-citas-app/issues)
- Revisa la [Documentación de FullCalendar](https://fullcalendar.io)
- Consulta [Google Sheets API Docs](https://developers.google.com/sheets/api)

---

Hecho con ❤️ para gestionar tus citas de forma simple y profesional.