class EditMode {
  constructor(roots, context) {
    this.roots = roots;
    this.context = context;
    this.roots.dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.roots.dialog.close();
    });
  }

  openEdge() {
    const { state, letter } = this.context;
    const [a, b] = state.edge;
    this.roots.title.textContent = `ARISTA ${letter(a)} — ${letter(b)}`;
    this.roots.weight.value = state.graph.getDistance(a, b) || "";
    const source = state.graph.nodes.find((node) => node.id === a);
    const target = state.graph.nodes.find((node) => node.id === b);
    const distance = state.graph.calculateDistance(source, target);
    const label = `‖${letter(a)} − ${letter(b)}‖ · 0.01`;
    this.roots.position.textContent = `Por posición: ${label} = ${distance.toFixed(2)}`;
    const cy = state.cy;
    const rect = cy.container().getBoundingClientRect();
    const from = cy.getElementById(String(a)).renderedPosition();
    const to = cy.getElementById(String(b)).renderedPosition();
    const x = rect.left + (from.x + to.x) / 2;
    const y = rect.top + (from.y + to.y) / 2;
    this.roots.dialog.style.left = `${Math.min(window.innerWidth - 300, x + 12)}px`;
    this.roots.dialog.style.top = `${Math.min(window.innerHeight - 220, y + 12)}px`;
    if (!this.roots.dialog.open) this.roots.dialog.show();
  }

  restoreEdge() {
    const { state } = this.context;
    const [a, b] = state.edge;
    const source = state.graph.nodes.find((node) => node.id === a);
    const target = state.graph.nodes.find((node) => node.id === b);
    this.roots.weight.value = state.graph.calculateDistance(source, target).toFixed(2);
  }

  applyEdge() {
    const { state, resetEngine, drawGraph, render } = this.context;
    const value = Number(this.roots.weight.value);
    if (!(value > 0)) return;
    state.graph.addEdge(...state.edge, value);
    this.roots.dialog.close();
    resetEngine();
    drawGraph();
    render();
  }

  selectTool(button) {
    if (!button) return;
    this.context.state.tool = button.dataset.tool;
    this.roots.tools.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("selected", item === button);
    });
  }
}
