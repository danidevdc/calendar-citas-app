# 🧹 Limpiar Datos Inválidos del Google Sheet

## ⚠️ Problema

El error `Invalid time value` ocurre cuando hay **filas con datos incompletos o inválidos** en tu Google Sheet.

Esto puede pasar cuando:
- Borraste una fila manualmente dejando celdas vacías
- Hay fechas en formato incorrecto
- Hay horas en formato incorrecto
- Hay filas parcialmente llenas

---

## ✅ Solución Aplicada

Ya actualicé el código para que:
1. **Valide fechas y horas** antes de procesarlas
2. **Ignore filas inválidas** automáticamente
3. **Muestre advertencias** en la consola de qué se ignoró
4. **No crashee** si encuentra datos malos

---

## 🔍 Verificar tu Google Sheet

### Paso 1: Abre tu Sheet

Abre: https://docs.google.com/spreadsheets/d/1THx5FOoMbZWd0QeflmCwmiwnKX5OVPdFp6y9T2HBzyk/

### Paso 2: Verifica la Estructura

Tu sheet debe tener **exactamente 8 columnas** con estos encabezados en la fila 1:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **Nombre** | **Apellido** | **Carrera** | **Fecha** | **Hora** | **Duración** | **Tipo** | **Notas** |

### Paso 3: Verifica los Datos

**Desde la fila 2 en adelante**, verifica que:

#### Columna D - Fecha
- ✅ Correcto: `2026-02-14` (formato YYYY-MM-DD)
- ❌ Incorrecto: `14/02/2026`, `14-02-2026`, `Feb 14`

#### Columna E - Hora
- ✅ Correcto: `09:00`, `14:30`, `8:00`
- ❌ Incorrecto: `9`, `9am`, `14:30:00`

#### Columna F - Duración
- ✅ Correcto: `45`, `60`, `30` (solo números)
- ❌ Incorrecto: `45 min`, `una hora`, vacío

#### Columna G - Tipo
- ✅ Correcto: `presencial`, `virtual`, `telefonica`
- ❌ Incorrecto: cualquier otro valor

### Paso 4: Limpiar Filas Inválidas

**Opción 1: Eliminar filas problemáticas**
1. Identifica filas con datos incorrectos o incompletos
2. **Haz clic derecho en el número de fila** → **Eliminar fila**

**NO solo borres el contenido** (esto deja una fila vacía que puede causar problemas)

**Opción 2: Corregir los datos**
1. Edita las celdas con formato incorrecto
2. Asegúrate de usar los formatos correctos arriba

---

## 🧪 Probar Después de Limpiar

### 1. Commit los Cambios del Código

```bash
cd calendar-citas-app
git add .
git commit -m "fix: validación de fechas/horas, manejo de datos inválidos"
git push origin main
```

### 2. Esperar y Recargar

- Espera 1-2 minutos para que GitHub Pages actualice
- Abre tu app: `https://danidevdc.github.io/calendar-citas-app/`

### 3. Verificar en Consola

Abre DevTools (`F12`) → **Console**

Deberías ver:
```
📥 Cargando citas desde Google Sheets...
✅ 3 citas válidas de 5 filas
✅ 3 citas cargadas desde Sheets
```

Si ves advertencias:
```
⚠️ Fecha inválida ignorada: 14/02/2026
⚠️ Hora inválida ignorada: 9am
```

Esto significa que hay datos con formato incorrecto en tu Sheet. Corrígelos usando las guías arriba.

---

## 📋 Ejemplo de Datos Correctos

Copia esto en tu Sheet para probar (filas 2-4):

| Nombre | Apellido | Carrera | Fecha | Hora | Duración | Tipo | Notas |
|--------|----------|---------|------------|-------|----------|-----------|-------|
| María | González | Psicología | 2026-02-14 | 09:00 | 45 | presencial | Primera sesión |
| Carlos | Rodríguez | Ingeniería | 2026-02-14 | 11:30 | 60 | virtual | Seguimiento |
| Ana | Martínez | Medicina | 2026-02-15 | 10:00 | 45 | telefonica | |

---

## 🎯 Zona Horaria (GMT-4)

El código ahora usa `new Date(year, month - 1, day, hour, minute)` que crea fechas en **tu zona horaria local** automáticamente.

No necesitas hacer nada especial para GMT-4 (La Paz). El navegador maneja esto automáticamente.

---

## ✅ Verificación Final

Después de limpiar tu Sheet:

- [ ] Todas las fechas están en formato `YYYY-MM-DD`
- [ ] Todas las horas están en formato `HH:MM`
- [ ] Todas las duraciones son números (45, 60, etc.)
- [ ] Todos los tipos son `presencial`, `virtual`, o `telefonica`
- [ ] No hay filas vacías entre los datos
- [ ] Hice commit y push del código actualizado
- [ ] Esperé 1-2 minutos
- [ ] Recargué la app
- [ ] No hay errores en la consola
- [ ] El calendario muestra las citas correctamente

---

## 🆘 Si Siguen los Errores

1. **Borra TODAS las filas de datos** (deja solo los encabezados)
2. **Agrega una cita de prueba** usando el ejemplo de arriba
3. **Recarga la app**
4. **Si funciona**, agrega más citas una por una verificando el formato

¡Listo! 🎉
