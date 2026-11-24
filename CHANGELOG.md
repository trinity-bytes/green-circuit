# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-24

Primera versión publicada como **Tourbench** en [tourbench.jahattrinidad.com](https://tourbench.jahattrinidad.com).

### Agregado

- App rediseñada ("Search Bench"): Inspector con la ruta actual y su suma parcial, mejor ruta hasta el momento y matriz de adyacencia con las aristas activas.
- Trace virtualizado de todos los ciclos evaluados, filtro "solo mejoras" y exportación a CSV / JSON.
- Vista de resultado con distancia, tiempo y CO₂, fórmulas con valores reales y comparación con la peor ruta.
- Modo edición con popover de peso de arista y validación de ciclo hamiltoniano.
- Reproducción con pasos y velocidades 1×, 10×, 100× y Máx; confirmación con estimaciones medidas para N ≥ 10.
- Atajos de teclado, nodos recorribles con Tab, anuncios `aria-live` y soporte de `prefers-reduced-motion`.
- Página del proyecto con problema, método, muro factorial, métricas y arquitectura.
- Diálogo "Acerca de" con enlaces al autor.
- Metadata para buscadores y redes (Open Graph, Twitter), favicon, `robots.txt` y `sitemap.xml`.
- Pruebas del motor con `node --test`.

### Cambiado

- El proyecto pasa a llamarse **Tourbench** (antes GreenCircuit).
- Nuevo motor `SearchEngine`: enumera los ciclos en streaming y guarda solo su costo en un `Float32Array`; la ruta se reconstruye desde el índice.
- N limitado a 4–11.
- La página del proyecto es la raíz del sitio (`index.html`) y la app vive en `app.html`.
- Diseño en Catppuccin Latte con IBM Plex Sans / Mono.

### Eliminado

- Wizard de 4 pasos, consola de logs y los módulos `HamiltonianFinder`, `TSPSolver`, `LogDisplay`, `CytoscapeRenderer` y `GraphEditor`.
- Hojas de estilo anteriores y Font Awesome.

[1.0.0]: https://github.com/trinity-bytes/green-circuit/releases/tag/v1.0.0
