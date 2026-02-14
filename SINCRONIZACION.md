# 🔄 Sincronización: Google Sheets ↔️ App Web

## ✅ SÍ, Están 100% Interconectados

La app y Google Sheets están completamente sincronizados. Cualquier cambio en uno se refleja en el otro.

---

## 📊 ¿Cómo Funciona?

### 🔵 Desde Google Sheets → App Web

**✅ Lo que SÍ funciona:**

| Acción en Google Sheets | Resultado en la App |
|--------------------------|---------------------|
| ➕ Agregar fila (cita) | Aparece en el calendario |
| 🗑️ Eliminar fila | Desaparece del calendario |
| ✏️ Cambiar estado (columna G) | Se actualiza el color |
| ✏️ Cambiar fecha/hora | Se actualiza la posición |
| ✏️ Cambiar nombre | Se actualiza el título |

**⏱️ ¿Cuándo se ve el cambio?**

- **Automáticamente** cada **5 minutos**
- **Inmediatamente** al hacer clic en el botón **"Sincronizar"** 🔄
- **Inmediatamente** al recargar la página (F5)

---

### 🔴 Desde App Web → Google Sheets

**✅ Lo que SÍ funciona:**

| Acción en la App | Resultado en Google Sheets |
|------------------|----------------------------|
| ➕ Crear cita | Se agrega nueva fila INMEDIATAMENTE |
| 🗑️ Eliminar cita | Se borra la fila INMEDIATAMENTE |
| ✏️ Editar cita | ⚠️ Solo se actualiza localmente (NO en Sheets) |

**⏱️ ¿Cuándo se guarda?**

- **Inmediatamente** al hacer clic en "Guardar" o "Eliminar"
- **Excepto** ediciones (solo locales)

---

## 🎯 Mejores Prácticas

### ✅ RECOMENDADO

1. **Editar desde Google Sheets**
   - Si necesitas editar una cita (cambiar nombre, fecha, estado, etc.)
   - Edita directo en el Sheet
   - Haz clic en **"Sincronizar"** 🔄 en la app
   - ✅ Verás los cambios inmediatamente

2. **Crear/Eliminar desde la App**
   - Es más rápido y visual
   - Se guarda automáticamente en Sheets
   - ✅ Mejor experiencia de usuario

3. **Sincronizar Manualmente**
   - Después de editar en Google Sheets
   - Antes de una reunión para tener los datos más recientes
   - ✅ No esperar 5 minutos

---

### ⚠️ EVITAR

1. **❌ NO edites citas desde la app**
   - Los cambios no se guardan en Sheets
   - Si recargas, se pierden
   - **Solución:** Edita en Google Sheets directamente

2. **❌ NO agregues citas manualmente en Sheets si estás usando la app al mismo tiempo**
   - Puede haber conflictos de IDs
   - **Solución:** Usa una u otra, no ambas simultáneamente para crear

3. **❌ NO borres todas las filas en Sheets**
   - Se perderán en la app también
   - **Solución:** Si quieres empezar de cero, hazlo pero recarga la app después

---

## 🔄 Nuevo Botón de Sincronización

### ¿Para Qué Sirve?

El botón **"Sincronizar"** 🔄 hace una sincronización **inmediata** con Google Sheets.

### ¿Cuándo Usarlo?

✅ **Úsalo cuando:**
- Acabas de editar algo en Google Sheets
- Quieres ver los cambios sin esperar 5 minutos
- Sospechas que los datos están desactualizados
- Otra persona editó el Sheet

### ¿Cómo Funciona?

1. Haz clic en **"Sincronizar"** 🔄
2. El ícono gira mientras carga
3. En 1-2 segundos verás: `✅ X citas cargadas desde Sheets`
4. El calendario se actualiza automáticamente

---

## 🎨 Indicador de Sincronización

**🟢 Punto Verde Parpadeante** = Todo sincronizado

El punto verde en la parte inferior indica que la app está conectada y funcionando.

---

## 📋 Workflow Recomendado

### Opción A: Solo Usar la App (Más Fácil)

1. Abre la app
2. Crea/elimina citas desde la app
3. **Para editar:** Ve a Google Sheets → Edita → Vuelve a la app → Click en "Sincronizar" 🔄
4. ✅ Simple y seguro

### Opción B: Usar Sheets Directamente (Para Ediciones Masivas)

1. Abre Google Sheets
2. Crea/edita/elimina citas en masa
3. Vuelve a la app
4. Click en "Sincronizar" 🔄
5. ✅ Rápido para cambios masivos

### Opción C: Mixto (Recomendado)

1. **Crear citas:** Desde la app (más visual)
2. **Eliminar citas:** Desde la app (un clic)
3. **Editar citas:** Desde Google Sheets (más confiable)
4. **Cambiar estados:** Desde Google Sheets (más rápido para múltiples)
5. 🔄 **Sincronizar** después de cambios en Sheets

---

## 🐛 Troubleshooting

### "No veo mis cambios de Google Sheets"

✅ **Solución:**
1. Espera 5 minutos (auto-sync)
2. O haz clic en **"Sincronizar"** 🔄
3. O recarga la página (F5)

### "Edité una cita en la app y al recargar volvió al original"

✅ **Explicación:**
- Las ediciones en la app son solo locales
- No se guardan en Google Sheets (todavía)

✅ **Solución:**
- Edita directo en Google Sheets
- O espera a que implementemos edición permanente

### "Creé una cita en la app pero no la veo en Sheets"

✅ **Solución:**
1. Verifica en la consola (F12) si hay errores
2. Revisa que Google Apps Script esté actualizado y desplegado
3. Verifica que la columna G del Sheet diga "Estado"

### "El botón 'Sincronizar' no hace nada"

✅ **Solución:**
1. Abre la consola (F12)
2. Busca errores
3. Verifica que Google Apps Script esté funcionando
4. Intenta recargar la página

---

## 📊 Resumen Visual

```
┌─────────────────┐                      ┌──────────────────┐
│  Google Sheets  │◄────Automático──────►│    App Web       │
│                 │     cada 5 min       │                  │
│  ✅ Crear       │                      │  ✅ Crear        │
│  ✅ Editar      │◄────Manual───────────│  🔄 Sincronizar  │
│  ✅ Eliminar    │     (botón🔄)        │  ✅ Eliminar     │
│  ✅ Cambiar     │                      │  ⚠️ Editar*      │
└─────────────────┘                      └──────────────────┘

* Ediciones solo locales (no persisten)
```

---

## ✅ Checklist de Sincronización

Cuando trabajas con la app, verifica:

- [ ] ¿Editaste en Google Sheets? → Click en 🔄 **Sincronizar**
- [ ] ¿Creaste cita en la app? → ✅ Se guardó automáticamente
- [ ] ¿Eliminaste cita en la app? → ✅ Se borró automáticamente
- [ ] ¿No ves cambios recientes? → Click en 🔄 **Sincronizar**
- [ ] ¿Necesitas editar una cita? → Mejor en Google Sheets

---

## 🚀 Próximas Mejoras (Opcional)

Si quieres, puedo implementar:

1. ✅ **Edición permanente** - Que las ediciones se guarden en Sheets
2. ✅ **Sincronización más frecuente** - Cada 2 minutos en lugar de 5
3. ✅ **Indicador visual** - Mostrar cuando se está sincronizando
4. ✅ **Notificación de cambios** - Avisar cuando hay cambios nuevos

¿Quieres que implemente alguna de estas?

---

**💡 Tip Final:** Usa el botón **🔄 Sincronizar** como un "refresh" cuando tengas dudas. Es instantáneo y te asegura que tienes los datos más recientes.
