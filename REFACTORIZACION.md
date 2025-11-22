# Refactorización del Sistema - Módulo Unificado Inteligente

## 📋 Resumen de Cambios

Se ha refactorizado el sistema para consolidar 3 módulos redundantes (Cabinas, Lavacar, Impresión) en **un solo módulo inteligente** que detecta el tipo de negocio del usuario y adapta automáticamente su comportamiento.

## ✅ Beneficios

- **-63% de código**: De ~1900 líneas a ~700 líneas
- **Mantenimiento simplificado**: 1 archivo en lugar de 3
- **Consistencia garantizada**: Misma lógica para todos los negocios
- **Diseño móvil optimizado**: Elementos compactos que ahorran espacio
- **Escalabilidad**: Fácil agregar nuevos tipos de negocio

## 🆕 Archivos Creados

### `public/trabajo.html`
HTML unificado con:
- Stats grid compacto (2x2 en móvil, 4x1 en desktop)
- Navbar que muestra tipo de negocio
- Contenedores dinámicos para campos específicos
- Sistema responsive optimizado

### `public/js/trabajo.js`
Módulo inteligente que:
- Detecta automáticamente el negocio del usuario desde la API
- Adapta títulos, iconos y labels según tipo de negocio
- Renderiza campos específicos dinámicamente (cédula/edad para Cabinas)
- Carga plantillas personalizadas por negocio
- Conserva todas las funcionalidades:
  - Auto-cambio de pestañas móvil con animación
  - Sistema de accesos rápidos con precios
  - Modal de ganancias con estadísticas
  - Polling en tiempo real

## 🎨 Mejoras de Diseño Móvil

### Stats Cards Compactos
```css
.stats-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2x2 en móvil */
  gap: 0.75rem;
}

.stat-card-compact {
  padding: 0.75rem; /* Reducido de 1.5rem */
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
```

### Tamaños Reducidos
- Íconos: `2rem` → `1.5rem`
- Valores: `2rem` → `1.5rem`
- Labels: `0.875rem` → `0.75rem`
- Padding cards: `1.5rem` → `0.75rem`

## 🔧 Configuración por Tipo de Negocio

```javascript
config: {
  iconos: {
    'Cabinas': '💻',
    'Lavacar': '🚗',
    'Impresión': '🖨️'
  },
  titulos: {
    'Cabinas': {
      nuevo: 'Nueva Sesión',
      enProceso: '💻 Sesiones Activas',
      labelPrecio: 'Precio por Hora'
    },
    // ...
  }
}
```

## 📦 Plantillas por Defecto

### Cabinas
- 1 noche - ₡1000
- 2 noches - ₡2000
- Tareas - ₡500

### Lavacar
- Lavado completo - ₡5000
- Encerado - ₡3000

### Impresión
- 10 copias B/N - ₡500
- Anillado - ₡1500

## 🔄 Rutas Actualizadas

**Antes:**
```javascript
if (negocioData.nombre === 'Cabinas') {
  window.location.href = '/cabinas.html';
} else if (negocioData.nombre === 'Impresión') {
  window.location.href = '/impresion.html';
} else if (negocioData.nombre === 'Lavacar') {
  window.location.href = '/lavacar.html';
}
```

**Ahora:**
```javascript
// Todos los negocios usan el mismo módulo
window.location.href = '/trabajo.html';
```

## 🚀 Cómo Funciona

1. **Autenticación**: Usuario inicia sesión
2. **Detección**: `trabajo.js` consulta API para obtener `negocioId` del usuario
3. **Carga de Negocio**: Consulta detalles del negocio para saber su tipo ("Cabinas", "Lavacar", etc.)
4. **Personalización**: Adapta interfaz según configuración del tipo
5. **Renderizado**: Muestra campos específicos y plantillas correspondientes

## 📱 Adaptación Móvil

### Desktop (> 768px)
- Grid de 4 columnas (Pendientes | Activos | Completados | Ganancias)
- Stats cards verticales con padding normal
- Todas las pestañas visibles

### Móvil (≤ 768px)
- Grid de 2x2 compacto
- Stats cards horizontales (icono + texto)
- Pestañas con navegación por botones
- Auto-switch al cambiar estado

## 🗂️ Archivos a Deprecar

Una vez verificado el funcionamiento, se pueden eliminar:
- `public/cabinas.html` + `public/js/cabinas.js` (~620 líneas)
- `public/lavacar.html` + `public/js/lavacar.js` (~640 líneas)
- `public/impresion.html` + `public/js/impresion.js` (~640 líneas)

**Total eliminado: ~1900 líneas**

## 📋 Checklist de Testing

- [ ] Login con usuario de Cabinas → Verifica campos cédula/edad
- [ ] Login con usuario de Lavacar → Verifica ausencia de campos extra
- [ ] Login con usuario de Impresión → Verifica ausencia de campos extra
- [ ] Verificar navbar muestra nombre de negocio (no "General")
- [ ] Probar accesos rápidos con precios
- [ ] Probar modal de ganancias
- [ ] Probar auto-cambio de pestañas en móvil
- [ ] Verificar stats grid compacto en móvil (2x2)
- [ ] Verificar grid normal en desktop (4x1)

## 🎯 Próximos Pasos

1. **Testing completo**: Verificar funcionamiento en todos los negocios
2. **Migración de datos**: Si es necesario migrar localStorage de plantillas
3. **Limpieza**: Eliminar archivos obsoletos (cabinas, lavacar, impresion)
4. **Documentación**: Actualizar README con nueva arquitectura
5. **Nuevos negocios**: Facilidad para agregar más tipos en el futuro

## 💡 Agregar Nuevo Tipo de Negocio

```javascript
// 1. Agregar al config en trabajo.js
config: {
  iconos: {
    'NuevoTipo': '🔧'
  },
  titulos: {
    'NuevoTipo': {
      nuevo: 'Nuevo Trabajo',
      enProceso: '🔧 Trabajos Activos',
      labelPrecio: 'Precio'
    }
  }
}

// 2. Agregar plantillas default
getPlantillasDefault() {
  const defaults = {
    'NuevoTipo': [
      {texto: 'Plantilla 1', precio: 1000}
    ],
    // ...
  };
}

// 3. (Opcional) Agregar campos específicos
if (this.negocioTipo === 'NuevoTipo') {
  containerTrabajo.innerHTML = `
    <div class="form-group">
      <label>Campo Específico</label>
      <input type="text" id="campoEspecifico" class="form-input">
    </div>
  `;
}
```

---

**Fecha de Refactorización**: 2024  
**Versión**: 2.0
