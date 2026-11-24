class AppView {
  constructor(roots, context) {
    this.roots = roots;
    this.context = context;
  }
  runStatus() {
    const { state } = this.context;
    if (state.engine.done) return "completo";
    return state.playing ? "ejecutando" : "listo";
  }

  render() {
    const { state, number, fmt, renderInspector, renderTrace, colorGraph } = this.context;
    const $ = (id) => this.roots[id];
    const e = state.engine,
      total = e.capacity,
      pct = total ? Math.max(0, state.cursor + 1) / total : 0;
    $("restart").hidden = !e.count || state.edit;
    $("canvas-help").hidden = e.count > 0;
    $("node-count").textContent = state.n;
    $("complexity").textContent = `(N−1)! = ${number(total)} ciclos · ${e.estimatedTime}`;
    const layoutNames = { random: "ALEATORIO", grid: "CUADRÍCULA", circular: "CIRCULAR" };
    const graphKind = state.graph.isComplete() ? "GRAFO COMPLETO" : "GRAFO EDITADO";
    $("instance").textContent =
      `INSTANCIA · N = ${state.n} · ${layoutNames[state.layout]} · ` +
      `${state.graph.edges.length} ARISTAS · ${graphKind}`;
    $("progress-text").textContent = state.edit
      ? "Sal del modo edición para ejecutar"
      : `${number(Math.max(0, state.cursor + 1))} / ${number(total)} ciclos  ` +
        `${(pct * 100).toFixed(1)} % · ${this.runStatus()}`;
    $("improvement-count").textContent = e.improvements.length
      ? `${e.improvements.length} mejoras`
      : "sin mejoras aún";
    $("progress-fill").style.width = `${pct * 100}%`;
    $("playhead").style.left = `calc(${pct * 100}% - 6px)`;
    $("ticks").innerHTML = e.improvements
      .map((x) => `<span class="tick" style="left:${(x.index / total) * 100}%"></span>`)
      .join("");
    const playIcon = state.playing ? "pause" : "play";
    const playLabel = state.edit
      ? "Ejecutar"
      : state.playing
        ? "Pausa"
        : e.done
          ? "Repetir"
          : "Ejecutar";
    $("play").innerHTML = `<svg class="icon" width="16" height="16" aria-hidden="true">
      <use href="assets/icons.svg#icon-${playIcon}"></use></svg> ${playLabel}`;
    for (const control of [$("minus"), $("plus"), $("regenerate"), $("edit")]) {
      control.disabled = state.playing;
    }
    $("layouts")
      .querySelectorAll("button")
      .forEach((control) => {
        control.disabled = state.playing;
      });
    $("speeds")
      .querySelectorAll("button")
      .forEach((button) => {
        button.disabled = state.edit;
      });
    $("play").disabled = state.edit;
    $("track").hidden = state.edit;
    $("improvement-count").hidden = state.edit;
    $("tools").hidden = !state.edit;
    const editIcon = state.edit ? "check" : "pencil";
    const editLabel = state.edit ? "Listo" : "Editar grafo";
    $("edit").classList.toggle("primary", state.edit);
    $("edit").innerHTML =
      `<svg class="icon" width="16" height="16" aria-hidden="true">` +
      `<use href="assets/icons.svg#icon-${editIcon}"></use></svg> ${editLabel}`;
    $("trace-count").textContent = e.count && !state.edit ? number(e.count) : "";
    $("inspector").hidden = state.tab !== "inspector";
    $("trace").hidden = state.tab !== "trace";
    $("inspector-tab").setAttribute("aria-selected", String(state.tab === "inspector"));
    $("trace-tab").setAttribute("aria-selected", String(state.tab === "trace"));
    const legend = $("legend");
    if (e.count && e.best && !state.edit) {
      const current = `#${number(state.cursor + 1)} · ${fmt(e.costs[state.cursor])} km`;
      const best = `#${number(e.best.index + 1)} · ${fmt(e.best.cost)} km`;
      legend.innerHTML = e.done
        ? `<span class="best-key">Óptima ${best}</span><span class="edge-key">Arista</span>` +
          `<button id="worst-toggle" aria-pressed="${state.showWorst}">` +
          `Superponer peor ruta (${fmt(e.worst.cost)} km)</button>`
        : `<span class="current-key">Explorando ${current}</span>` +
          `<span class="best-key">Mejor ${best}</span><span class="edge-key">Arista</span>`;
    } else {
      legend.innerHTML = "";
    }
    const worstToggle = legend.querySelector("#worst-toggle");
    if (worstToggle)
      worstToggle.onclick = () => {
        state.showWorst = !state.showWorst;
        this.render();
      };
    renderInspector();
    if (state.tab === "trace") renderTrace();
    colorGraph();
  }
}
