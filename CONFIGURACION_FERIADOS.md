# Configuración de Días Feriados

Este documento explica cómo configurar los días feriados en el calendario.

## Archivo de Configuración

Los días feriados se configuran en el archivo: `js/holidays.js`

## Cómo Agregar Días Feriados

### 1. Formato de Fechas

Puedes agregar fechas en dos formatos:

- **Formato anual repetitivo** `MM-DD`: La fecha se marcará como feriado cada año
  ```javascript
  '12-25'  // Navidad (25 de diciembre de cada año)
  ```

- **Formato de fecha específica** `YYYY-MM-DD`: Solo ese día específico será marcado
  ```javascript
  '2026-03-15'  // Solo el 15 de marzo de 2026
  ```

### 2. Editar el Array HOLIDAYS

Abre el archivo `js/holidays.js` y agrega tus fechas al array `HOLIDAYS`:

```javascript
const HOLIDAYS = [
    '01-01',  // Año Nuevo
    '12-25',  // Navidad
    '2026-07-04',  // Fecha específica
    // Agrega más fechas aquí...
];
```

### 3. Agregar Nombres de Feriados (Opcional)

Para mostrar el nombre del feriado al pasar el mouse, edita el objeto `holidayNames` en la función `getHolidayName`:

```javascript
const holidayNames = {
    '01-01': 'Año Nuevo',
    '12-25': 'Navidad',
    '05-01': 'Día del Trabajo',
    // Agrega más nombres aquí...
};
```

## Estilos de Días Feriados

Los días feriados se muestran con:
- Fondo amarillo/dorado suave
- Borde dorado
- Número en color naranja/dorado
- Emoji de celebración 🎉 en la esquina superior derecha

## Ejemplos de Días Feriados Comunes

### México
```javascript
'01-01',  // Año Nuevo
'02-05',  // Día de la Constitución
'03-21',  // Natalicio de Benito Juárez
'05-01',  // Día del Trabajo
'09-16',  // Día de la Independencia
'11-20',  // Día de la Revolución
'12-25',  // Navidad
```

### Estados Unidos
```javascript
'01-01',  // New Year's Day
'07-04',  // Independence Day
'11-11',  // Veterans Day
'12-25',  // Christmas
```

### Internacional
```javascript
'01-01',  // Año Nuevo
'05-01',  // Día del Trabajo
'12-25',  // Navidad
'12-31',  // Nochevieja
```

## Notas Importantes

- Los cambios en `holidays.js` requieren recargar la página
- Las fechas deben estar en formato `MM-DD` o `YYYY-MM-DD`
- Usa comillas simples o dobles
- Separa cada fecha con una coma
- Los días feriados que caen en el pasado se mostrarán más opacos
- Los días feriados en fin de semana tienen una combinación de estilos azul y dorado

## Verificar Configuración

Para verificar si un día es feriado, puedes usar la consola del navegador:

```javascript
// Verificar si el 25 de diciembre es feriado
isHoliday(new Date(2026, 11, 25));  // true

// Obtener el nombre del feriado
getHolidayName(new Date(2026, 11, 25));  // "Navidad"
```
