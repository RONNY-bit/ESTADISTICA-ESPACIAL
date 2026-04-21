# 📁 CRQC — Portafolio Académico

Portafolio académico de **Clever Ronny Quenta Chura**  
Universidad Nacional del Altiplano · Puno · 2026

---

## 🚀 Cómo usar

### Requisitos
- Solo un navegador moderno (Chrome, Firefox, Edge, Safari)
- No necesita servidor, PHP, ni base de datos
- Funciona con GitHub Pages al 100%

### Abrir localmente
1. Descarga o clona el repositorio
2. Abre `index.html` en tu navegador
3. ¡Listo!

### Subir a GitHub Pages
1. Sube todos los archivos al repositorio (rama `main` o `gh-pages`)
2. En GitHub → Settings → Pages → selecciona la rama
3. Tu portafolio estará disponible en `https://tuusuario.github.io/repo/`

---

## 🔐 Login del administrador

| Campo      | Valor por defecto |
|------------|-------------------|
| Usuario    | `admin`           |
| Contraseña | `crqc2026`        |

> **Importante:** Cambia la contraseña desde el Panel Admin → Configuración inmediatamente después del primer ingreso.

Para acceder al panel: haz clic en el ícono 🔒 de la barra de navegación o ve a `/admin/login.html`

---

## 📂 Estructura del proyecto

```
portfolio/
├── index.html              ← Portafolio público
├── css/
│   ├── style.css           ← Estilos del portafolio
│   └── admin.css           ← Estilos del panel admin
├── js/
│   ├── data.js             ← Capa de datos (localStorage)
│   ├── portfolio.js        ← Renderizador del portafolio
│   ├── panel.js            ← Lógica del panel admin
│   └── canvas.js           ← Animación de fondo (estrellas)
├── admin/
│   ├── login.html          ← Página de login
│   └── panel.html          ← Panel de administración
└── README.md
```

---

## ✨ Funcionalidades

### Panel de Administración
- ✅ Login seguro (usuario + contraseña)
- ✅ Dashboard con estadísticas
- ✅ Subir archivos: PDF, R, Rmd, CSV, DOCX, XLSX, ZIP, imágenes, etc.
- ✅ Agregar enlaces externos (GitHub, Drive, etc.)
- ✅ Drag & drop para subir archivos
- ✅ Gestión de unidades (crear y eliminar)
- ✅ Editar y borrar trabajos
- ✅ Cambiar contraseña
- ✅ Exportar/importar datos (JSON backup)

### Portafolio Público
- ✅ Ver trabajos organizados por unidad
- ✅ Abrir archivos PDF en el navegador
- ✅ Descargar archivos
- ✅ Acceder a enlaces externos
- ✅ Animación de fondo con estrellas y partículas
- ✅ Diseño responsivo (móvil y escritorio)

---

## 💾 Almacenamiento

Los datos se guardan en el `localStorage` del navegador. Los archivos se convierten a base64 y se almacenan directamente. Esto significa:

- **No necesitas servidor** → funciona en GitHub Pages
- Los datos persisten entre sesiones en el mismo navegador
- Para **migrar o respaldar** datos: usa Exportar JSON desde Configuración
- Para **importar** en otro dispositivo: usa Importar JSON

### Límites aproximados de localStorage
| Navegador | Límite |
|-----------|--------|
| Chrome    | ~5 MB  |
| Firefox   | ~10 MB |
| Safari    | ~5 MB  |

Para portafolios grandes, considera comprimir los PDF antes de subirlos.

---

## 🎨 Personalización

Edita las variables CSS en `css/style.css`:
```css
:root {
  --accent:  #00e5ff;   /* Color principal (cyan) */
  --accent2: #7b2fff;   /* Color secundario (morado) */
  --bg:      #0a0b0f;   /* Fondo */
  --green:   #39ff14;   /* Verde neón */
}
```

---

*Hecho con HTML, CSS y JavaScript puro — sin frameworks ni dependencias externas*
