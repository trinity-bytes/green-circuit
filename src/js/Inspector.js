// Inspector tab: stepper, current/best route, validation, adjacency matrix and model.
class Inspector {
  constructor(root, context, resultPanel) {
    this.root = root;
    this.context = context;
    this.resultPanel = resultPanel;
  }

  render() {
    const { state } = this.context;
    const engine = state.engine;
    let content = "";

    if (state.edit) {
      content += this.validationSection();
    } else {
      content += this.stepper(engine);
      if (!engine.count) content += this.readySection(engine);
      else if (engine.done && engine.best) content += this.resultPanel.render(engine);
      else if (engine.error) content += this.noCycleSection();
      else content += this.currentRouteSection(engine) + this.bestSection(engine);
    }

    content += this.matrixSection(engine) + this.modelSection(engine);
    if (state.edit) content += this.nodeSection();
    this.root.innerHTML = content;
    this.scrollImprovementsToEnd(engine);
  }

  stepper(engine) {
    const step = (label, active, done, number) =>
      `<span class="${active ? "active" : ""}" data-num="${done ? "✓" : number}">${label}</span>`;
    return (
      `<section class="section"><div class="step-list">` +
      step("Matriz", true, true, 1) +
      step("Backtracking", engine.count > 0, engine.done, 2) +
      step("Resultado", engine.done, engine.done, 3) +
      `</div></section>`
    );
  }

  readySection(engine) {
    const { number } = this.context;
    return Markup.section(
      "LISTO PARA EJECUTAR",
      `<p>Se evaluarán ${number(engine.capacity)} ciclos desde A. ` +
        `Durante la ejecución verás la ruta en evaluación en azul ` +
        `y la mejor encontrada en verde.</p>` +
        `<p class="meta">Espacio &nbsp; ejecutar / pausar &nbsp; ← → &nbsp; paso</p>`,
    );
  }

  noCycleSection() {
    return Markup.section(
      "VALIDACIÓN",
      `<p class="error">No existe un ciclo hamiltoniano en este grafo.</p>`,
    );
  }

  currentRouteSection(engine) {
    const { state, number, fmt, routeText } = this.context;
    const route = engine.routeAt(state.cursor);
    const distances = route.slice(1).map((node, i) => state.graph.getDistance(route[i], node));
    const sums = [distances.slice(0, 4), distances.slice(4)]
      .map((chunk) => chunk.map(fmt).join(" + "))
      .join("<br>+ ");
    const cost = engine.costs[state.cursor];
    const bestCost = this.bestUpToCursor(engine)?.cost ?? cost;
    const comparison =
      cost > bestCost
        ? `${fmt(cost)} > ${fmt(bestCost)} → se descarta (+${fmt(cost - bestCost)} km)`
        : `${fmt(cost)} = ${fmt(bestCost)} → mejor ruta`;

    return Markup.section(
      "RUTA ACTUAL",
      `<p class="route">${routeText(route)}</p>` +
        `<p class="mono sums">${sums}</p>` +
        `<div class="value current-value">Σ = ${fmt(cost)} km</div>` +
        `<p class="meta">${comparison}</p>`,
      `#${number(state.cursor + 1)} de ${number(engine.capacity)}`,
    );
  }

  bestSection(engine) {
    const { number, fmt, routeText } = this.context;
    const best = this.bestUpToCursor(engine);
    const cost = best?.cost ?? 0;
    const metrics = SearchEngine.metrics(cost);
    return Markup.section(
      "MEJOR HASTA AHORA",
      `<div class="best-block">` +
        `<p class="route">${routeText(best ? engine.routeAt(best.index) : null)}</p>` +
        `<p class="mono">${fmt(cost)} km · ${fmt(metrics.time)} min · ` +
        `${fmt(metrics.co2)} kg CO₂</p></div>`,
      `#${number((best?.index ?? 0) + 1)} · ${engine.improvements.length} mejoras`,
    );
  }

  bestUpToCursor(engine) {
    const { state } = this.context;
    return engine.improvements.filter((item) => item.index <= state.cursor).at(-1);
  }

  validationSection() {
    const { state, number, letter } = this.context;
    const graph = state.graph;
    const n = graph.nodes.length;
    const weakest = graph.nodes
      .map((node) => ({ id: node.id, degree: this.degree(node.id) }))
      .reduce((a, b) => (a.degree < b.degree ? a : b));

    let message;
    if (weakest.degree < 2) {
      const name = letter(weakest.id);
      message =
        `<p class="error">${name} tiene una sola arista: ningún ciclo puede entrar y salir ` +
        `de ${name}. Conecta ${name} con otro nodo para poder ejecutar.</p>`;
    } else if (graph.isComplete()) {
      message =
        `<p>${Markup.icon("check")} ` +
        `Grafo completo: existe al menos un ciclo hamiltoniano.</p>`;
    } else {
      message = `<p>El grafo se validará al ejecutar.</p>`;
    }

    return Markup.section(
      "VALIDACIÓN",
      Markup.stats([
        ["NODOS", n],
        ["ARISTAS", `${graph.edges.length} / ${(n * (n - 1)) / 2}`],
        ["CICLOS", number(state.engine.capacity)],
      ]) + message,
      "se recalcula al editar",
    );
  }

  degree(id) {
    const { state } = this.context;
    return state.graph.edges.filter((edge) => edge.from === id || edge.to === id).length;
  }

  matrixSection(engine) {
    const { state } = this.context;
    if (engine.done && !state.edit) return Markup.section("MATRIZ DE ADYACENCIA", "", "›");

    const showLegend = state.cursor >= 0 && !state.edit && !engine.done;
    const note = state.edit
      ? "La matriz es simétrica: editar un peso actualiza ambas direcciones."
      : `Fase 1 completa al generar el grafo: ${state.graph.edges.length} distancias.`;
    return Markup.section(
      "MATRIZ DE ADYACENCIA",
      this.matrix() +
        (showLegend ? `<p class="meta mono matrix-legend">■ última arista sumada</p>` : "") +
        `<p class="meta">${note}</p>`,
      "w(i,j) en km · simétrica",
    );
  }

  matrix() {
    const { state, letter } = this.context;
    const nodes = state.graph.nodes;
    const header = nodes.map((node) => `<th>${letter(node.id)}</th>`).join("");
    const rows = nodes
      .map((a) => {
        const cells = nodes.map((b) => this.matrixCell(a.id, b.id)).join("");
        return `<tr><th>${letter(a.id)}</th>${cells}</tr>`;
      })
      .join("");
    return (
      `<div class="matrix-wrap"><table class="matrix${nodes.length > 9 ? " dense" : ""}">` +
      `<thead><tr><th></th>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
    );
  }

  matrixCell(a, b) {
    const { state, fmt } = this.context;
    if (a === b) return `<td class="diagonal">·</td>`;
    const distance = state.graph.getDistance(a, b);
    const value = distance === null ? "—" : fmt(distance);
    return `<td class="${this.matrixCellClass(a, b)}">${value}</td>`;
  }

  matrixCellClass(a, b) {
    const { state, routeEdges } = this.context;
    if (state.edit) {
      return a === state.selectedNode || b === state.selectedNode ? "active" : "";
    }
    const route = state.cursor >= 0 ? state.engine.routeAt(state.cursor) : null;
    if (!route || !routeEdges(route).has([a, b].sort((x, y) => x - y).join("-"))) return "";
    const isLastEdge = a === route.at(-2) && b === route.at(-1);
    return isLastEdge ? "active last" : "active";
  }

  modelSection(engine) {
    const { state, number } = this.context;
    return Markup.section(
      "MODELO",
      `<p class="mono">C(π) = Σ w(πᵢ, πᵢ₊₁), &nbsp; i = 0 … N−1</p>` +
        `<p class="mono">π* = argmin C(π) · ${state.n - 1}! = ` +
        `${number(engine.capacity)} ciclos</p>`,
    );
  }

  nodeSection() {
    const { state, fmt, letter } = this.context;
    const node = state.graph.nodes.find((item) => item.id === state.selectedNode);
    if (!node) return "";
    const edges = state.graph.edges
      .filter((edge) => edge.from === node.id || edge.to === node.id)
      .sort((a, b) => a.distance - b.distance);
    const describe = (edge) => {
      if (!edge) return "—";
      const other = edge.from === node.id ? edge.to : edge.from;
      return `${fmt(edge.distance)} → ${letter(other)}`;
    };
    return Markup.section(
      `NODO ${letter(node.id)}`,
      Markup.stats([
        ["GRADO", edges.length],
        ["ARISTA MÍN.", describe(edges[0])],
        ["ARISTA MÁX.", describe(edges.at(-1))],
      ]),
      `(${Math.round(node.x)}, ${Math.round(node.y)}) px`,
    );
  }

  scrollImprovementsToEnd(engine) {
    const list = this.root.querySelector(".improvements-scroll");
    if (list && this.lastScrolledEngine !== engine) {
      list.scrollTop = list.scrollHeight;
      this.lastScrolledEngine = engine;
    }
  }
}
