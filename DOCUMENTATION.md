# Documentación técnica — Tourbench

## Visión General

Tourbench es una aplicación web (HTML, CSS y JavaScript sin frameworks) que resuelve el problema del agente viajero (TSP) por fuerza bruta y muestra la búsqueda paso a paso. Todo corre en el navegador; no hay backend. La interfaz ("Search Bench") muestra en vivo la ruta evaluada, su suma parcial, la mejor ruta encontrada y la celda de la matriz que la produce.

## Arquitectura de Código

Cada módulo es una clase global cargada con `<script>` en `app.html`. Los algoritmos no conocen la interfaz.

| Módulo               | Rol principal                                                                 |
| -------------------- | ----------------------------------------------------------------------------- |
| `Graph.js`           | Modelo del grafo: nodos, aristas y matriz de adyacencia.                      |
| `RandomGenerator.js` | Layouts aleatorio (con semilla opcional), circular y cuadrícula.              |
| `SearchEngine.js`    | Backtracking en streaming: evalúa ciclos, mejor/peor ruta, mejoras, métricas. |
| `about.js`           | Abre el diálogo "Acerca de" en ambas páginas.                                 |
| `markup.js`          | Helpers de marcado compartidos (secciones, estadísticas, íconos).             |
| `GraphView.js`       | Renderizado con Cytoscape.js, resaltado de rutas y nodos accesibles por Tab.  |
| `Inspector.js`       | Pestaña Inspector: pasos, ruta actual, mejor ruta, matriz y modelo.           |
| `ResultPanel.js`     | Resultado: ruta óptima, métricas, comparación con la peor ruta y mejoras.     |
| `TracePanel.js`      | Pestaña Trace: tabla virtualizada, filtro de mejoras y exportación CSV/JSON.  |
| `Playback.js`        | Bucle de animación, velocidad, pasos y diálogo de confirmación (N ≥ 10).      |
| `EditMode.js`        | Herramientas de edición y popover de peso de arista.                          |
| `AppView.js`         | Barra superior, leyenda y barra de reproducción.                              |
| `app.js`             | Estado compartido, cableado de eventos y atajos de teclado.                   |

## Flujo del Algoritmo

1. **Fase 1 — Matriz**: al generar el grafo se precalcula `w(i, j)` (distancia euclidiana · 0.01 km) para consultas O(1).
2. **Fase 2 — Backtracking desde A**: `SearchEngine` enumera las permutaciones de los nodos restantes en orden lexicográfico, sin guardar las rutas. Solo guarda el costo de cada ciclo en un `Float32Array` de longitud (N−1)!.
3. **Fase 3 — Evaluación**: cada ciclo suma sus N aristas; si mejora al óptimo actual se registra como mejora. La ruta de cualquier fila del Trace se reconstruye a partir de su índice.

## Datos y Cálculos Clave

- **Rango de N**: 4–11. Con N = 11 hay 3 628 800 ciclos (~14 MB de costos); antes de ejecutar con N ≥ 10 se pide confirmación con el tiempo estimado.
- **Tiempo**: `t = d / 25 × 60` (minutos, 25 km/h de velocidad media urbana).
- **Emisiones**: `CO₂ = d × 0.2` (kg, factor de emisión por km).
- **Ahorro**: diferencia entre la peor ruta y la óptima.

## Interfaz

- **Barra superior**: N, layout, regenerar, modo edición.
- **Lienzo**: grafo con la ruta en evaluación (azul) y la mejor encontrada (verde).
- **Inspector / Trace**: paneles laterales descritos arriba.
- **Teclado**: Espacio ejecutar/pausar · ←/→ paso · Inicio/Fin · 1/2 pestañas · E edición · V/N/A/Supr herramientas · Tab recorre nodos · Esc cierra el popover.
- Entre 1024 y 1279 px se ocultan etiquetas secundarias de la barra superior y de reproducción; por debajo de 1024 px se muestra un aviso con enlace a la página del proyecto.

## Estilos

- `src/styles/tokens.css`: paleta Catppuccin Latte, roles de color y estilos de texto (IBM Plex Sans / Mono).
- `src/styles/app.css`, `src/styles/landing.css` y `src/styles/about.css`: estilos de la app, la página del proyecto y el diálogo "Acerca de".
- `assets/icons.svg`: sprite de íconos exportado del diseño en Figma.

## Pruebas

```bash
npm test   # node --test, sin dependencias
```

## Dependencias

- **Cytoscape.js** (CDN) para el renderizado interactivo del grafo.
- **IBM Plex Sans / Mono** (Google Fonts).

## Estructura de Carpetas

```text
root
├─ index.html      (página del proyecto, raíz del sitio)
├─ app.html        (la app, /app en GitHub Pages)
├─ package.json
├─ assets/
│  ├─ icons.svg
│  ├─ favicon.svg / apple-touch-icon.png
│  └─ og.png      (imagen para redes, 1200×630)
├─ src/
│  ├─ js/        (módulos listados arriba)
│  └─ styles/
│     ├─ tokens.css
│     ├─ app.css
│     └─ landing.css
└─ test/
   └─ search-engine.test.js
```
