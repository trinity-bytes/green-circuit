# 🌱 GreenCircuit

## Optimización de Rutas de Recolección de Residuos Urbanos

Aplicación web interactiva que implementa el **Problema del Agente Viajero (TSP)** para optimizar rutas de recolección de residuos, minimizando distancias, tiempo de recorrido y emisiones de CO₂.

---

## ⚠️ Aviso Académico

Este proyecto se publica con fines académicos y de referencia. El código está disponible para que otras personas se inspiren y aprendan, pero **no me hago responsable por el plagio total o parcial en entregas con calificación**. Si reutilizas partes del proyecto para trabajos evaluados, hazlo bajo tu propio criterio y respetando las políticas de tu institución.

---

## 📋 Descripción del Proyecto

**GreenCircuit** resuelve el problema de optimización de rutas urbanas aplicado a la recolección de residuos. Utiliza algoritmos de grafos para encontrar la ruta más eficiente que visite todos los puntos de recolección exactamente una vez y regrese al punto de origen.

### Objetivos

- ✅ Minimizar la distancia total recorrida.
- ✅ Reducir el tiempo de recolección.
- ✅ Disminuir las emisiones de CO₂.
- ✅ Optimizar recursos operativos y contribuir a la sostenibilidad urbana.

---

## 🚀 Cómo Ejecutar

### Método Simple (Recomendado)

1. Abre el archivo `index.html` en tu navegador web (haciendo doble clic).
2. ¡Listo para usar! ✅

### Requisitos

- **Navegador moderno**: Chrome, Firefox, Edge o Safari (versión actualizada).
- **JavaScript habilitado** (activado por defecto en la mayoría de los navegadores).
- **Conexión a Internet**: Solo se necesita la primera vez para cargar la biblioteca de visualización (Cytoscape.js). Después, funciona sin conexión.

---

## 🎯 Cómo Usar la Aplicación

1. Elige el **número de puntos (N)** entre 4 y 11 y un **layout** (Aleatorio, Circular o Cuadrícula).
2. Pulsa **Ejecutar** (o `Espacio`). Con N ≥ 10 se pide confirmación con el tiempo y la memoria estimados.
3. Observa el **Inspector**: la ruta en evaluación (azul) con su suma, la mejor encontrada (verde) y la celda activa de la matriz.
4. Abre el **Trace** (`2`) para ver cada ciclo evaluado, filtrar solo las mejoras y exportar a CSV o JSON.
5. Al terminar, el **Resultado** muestra la ruta óptima, su tiempo y CO₂, y la comparación con la peor ruta.
6. **Editar grafo** (`E`) permite mover nodos y cambiar pesos de aristas (doble clic en una arista).

Atajos: `Espacio` ejecutar/pausar · `←`/`→` paso · `Inicio`/`Fin` · `1`/`2` pestañas · `Tab` recorre nodos.

---

## 📁 Estructura del Proyecto

```text
📦 GreenCircuit/
├── 📄 index.html                 # Aplicación (Search Bench)
├── 📄 landing.html               # Página del proyecto
├── 📖 README.md
├── 📖 DOCUMENTATION.md           # Arquitectura y algoritmos
├── 📦 package.json               # Script de pruebas (node --test)
├── 📁 assets/icons.svg           # Sprite de íconos
├── 📁 test/                      # Pruebas del motor de búsqueda
└── 📁 src/
    ├── 📁 js/
    │   ├── app.js                # Estado, eventos y atajos
    │   ├── Graph.js              # Modelo del grafo y matriz
    │   ├── RandomGenerator.js    # Layouts de puntos
    │   ├── SearchEngine.js       # Backtracking en streaming
    │   ├── markup.js             # Helpers de marcado
    │   ├── GraphView.js          # Render con Cytoscape.js
    │   ├── Inspector.js          # Pestaña Inspector
    │   ├── ResultPanel.js        # Resultado
    │   ├── TracePanel.js         # Pestaña Trace y exportación
    │   ├── Playback.js           # Reproducción y confirmación
    │   ├── EditMode.js           # Modo edición
    │   └── AppView.js            # Barra superior y reproducción
    └── 📁 styles/
        ├── tokens.css            # Paleta y tipografía (Catppuccin Latte)
        ├── app.css               # Estilos de la aplicación
        └── landing.css           # Estilos de la landing
```

---

## 🏗️ Arquitectura Técnica

El proyecto sigue una arquitectura modular con una clara separación de responsabilidades.

- **`Graph.js`**: Representa el grafo, almacena nodos y aristas, y construye la matriz de adyacencia.
- **`SearchEngine.js`**: Implementa el **backtracking** desde A y evalúa cada ciclo por **fuerza bruta** sin guardar las rutas: solo el costo de cada ciclo en un `Float32Array`. La ruta de cualquier ciclo se reconstruye desde su índice.
- **`RandomGenerator.js`**: Genera los puntos en los modos aleatorio, circular y cuadrícula.
- **`GraphView.js`**: Utiliza **Cytoscape.js** para renderizar el grafo y resaltar la ruta en evaluación y la mejor.
- **`Inspector.js`, `TracePanel.js`, `ResultPanel.js`, `Playback.js`, `EditMode.js`, `AppView.js`**: Vistas de la interfaz.
- **`app.js`**: Estado compartido, cableado de eventos y atajos de teclado.

---

## 📈 Complejidad Computacional

| Operación                        | Complejidad   | Descripción                                         |
| -------------------------------- | ------------- | --------------------------------------------------- |
| Búsqueda de ciclos hamiltonianos | **O((n-1)!)** | Backtracking recursivo para explorar permutaciones. |
| Resolución TSP (fuerza bruta)    | **O(n!)**     | Evalúa la distancia de todos los ciclos.            |
| Construcción del grafo completo  | **O(n²)**     | Genera n(n-1)/2 aristas para un grafo completo.     |

**⚠️ Importante:** Por la complejidad factorial, la aplicación limita N a 11 (3 628 800 ciclos). Con N = 12 serían casi 40 millones de ciclos.

---

## 🌍 Impacto Ambiental del Proyecto

Este proyecto demuestra cómo la optimización algorítmica puede generar un impacto real en la sostenibilidad urbana:

- 🌳 **Reducción de emisiones de CO₂**: Menor contaminación atmosférica.
- ⛽ **Ahorro de combustible**: Reducción de costos operativos.
- ⏱️ **Eficiencia operativa**: Menor tiempo de recorrido.

Para una ruta de **10 puntos**, los ahorros diarios pueden rondar el **25%** en distancia, tiempo y emisiones de CO₂.

---

## 🐛 Solución de Problemas

- **La página está en blanco**: Espera 2-3 segundos. La biblioteca Cytoscape.js se está cargando desde internet.
- **Aparece "necesita una pantalla más ancha"**: La aplicación requiere al menos 1024 px de ancho.
- **La ejecución con N = 11 tarda**: Es esperado (3 628 800 ciclos). Usa la velocidad **Máx** o `Fin` para llegar al resultado.

---

## 📄 Licencia

Este repositorio se distribuye bajo la [licencia MIT](LICENSE). Úsalo, modifícalo o compártelo citando la fuente original.

### 🌱 GreenCircuit - 2025
