class TracePanel {
  constructor(root, context) {
    this.root = root;
    this.context = context;
    this.follow = true;
    root.innerHTML = `<section class="section"><h2>TRACE</h2><div class="trace-controls">
      <button id="all-filter">Todas</button><button id="best-filter"></button>
      <span class="grow"></span><button id="csv"><svg class="icon" width="16" height="16">
      <use href="assets/icons.svg#icon-download"></use></svg> CSV</button>
      <button id="json"><svg class="icon" width="16" height="16">
      <use href="assets/icons.svg#icon-download"></use></svg> JSON</button>
      </div><div class="trace-scroll"><table class="trace-table">
      <thead><tr><th></th><th>#</th><th>RUTA</th><th>Σ KM</th><th>Δ</th></tr></thead>
      <tbody></tbody></table></div></section>
      <section class="section"><div class="section-head"><h2 id="detail-title"></h2>
      <button id="follow-toggle"></button></div><div id="detail-body"></div></section>`;
    root.addEventListener("click", (event) => this.handleClick(event));
    root.querySelector(".trace-scroll").addEventListener("scroll", (event) => {
      if (this.follow) return;
      const offset = Math.floor(event.target.scrollTop / 32);
      if (offset !== this.context.state.traceOffset) {
        this.context.state.traceOffset = offset;
        this.render();
      }
    });
  }
  render() {
    const { state, number, fmt, letter } = this.context;
    const $ = (id) => this.root.querySelector(`#${id}`);
    const e = state.engine,
      totalRows = state.filter === "improvements" ? e.improvements.length : e.count,
      start = Math.min(state.traceOffset, Math.max(0, totalRows - 1)),
      visible = Math.min(24, totalRows - start),
      indices = Array.from({ length: visible }, (_, i) =>
        state.filter === "improvements" ? e.improvements[start + i].index : start + i,
      );
    const selected = this.follow ? state.cursor : (state.traceSelected ?? state.cursor);
    const route = selected >= 0 ? e.routeAt(selected) : null;
    const improvements = new Map(e.improvements.map((item) => [item.index, item.cost]));
    let shown = indices;
    if (this.follow && state.filter === "all" && e.count > 12) {
      shown = [...Array.from({ length: 11 }, (_, i) => i), state.cursor];
    }
    const rows = shown
      .map((i, position) => {
        const prior = e.improvements.filter((item) => item.index < i).at(-1);
        const delta = SearchEngine.traceDelta(i, e.costs[i], prior?.cost ?? null);
        const marker = improvements.has(i) ? "●" : "";
        const routeLabel = e.routeAt(i).map(letter).join("→");
        const gap =
          this.follow && position === 11 && state.cursor > 11 ? this.gapRow(e, state.cursor) : "";
        return (
          gap +
          `<tr data-index="${i}" class="${i === selected ? "selected" : ""}">` +
          `<td class="trace-mark">${marker}</td><td>${number(i + 1)}</td>` +
          `<td>${routeLabel}</td><td>${fmt(e.costs[i])}</td><td>${delta}</td></tr>`
        );
      })
      .join("");
    const topSpace = this.follow ? 0 : start * 32;
    const bottomSpace = this.follow ? 0 : Math.max(0, totalRows - start - visible) * 32;
    const body = this.root.querySelector("tbody");
    const phase1 =
      `FASE 1 · MATRIZ ${state.n}×${state.n} · ` +
      `${state.graph.edges.length} ARISTAS · ${e.phaseOneMs.toFixed(2)} MS`;
    body.innerHTML =
      `<tr><td colspan="5">${phase1}</td></tr>` +
      `<tr><td colspan="5">FASE 2 · BACKTRACKING DESDE A</td></tr>` +
      `<tr class="trace-spacer top-spacer" aria-hidden="true"><td colspan="5"></td></tr>` +
      rows +
      `<tr class="trace-spacer bottom-spacer" aria-hidden="true">` +
      `<td colspan="5"></td></tr>`;
    body.querySelector(".top-spacer").style.setProperty("--spacer-height", `${topSpace}px`);
    body.querySelector(".bottom-spacer").style.setProperty("--spacer-height", `${bottomSpace}px`);
    const detail = route
      ? route
          .slice(1)
          .map((id, i) => {
            const edge = `${letter(route[i])}→${letter(id)}`;
            return `<span>${edge} ${fmt(state.graph.getDistance(route[i], id))}</span>`;
          })
          .join("")
      : '<p class="meta">Selecciona una fila para ver el detalle.</p>';
    $("detail-title").textContent = `FILA #${number(selected + 1)} · EN EJECUCIÓN`;
    $("detail-body").innerHTML =
      `<div class="trace-detail mono">${detail}</div>` +
      `<p class="meta">Lista virtualizada: solo se guarda el costo de cada ciclo ` +
      `(Float32Array); la ruta se reconstruye al seleccionar la fila.</p>`;
    $("follow-toggle").textContent = this.follow ? "siguiendo ▾" : "pausado ▾";
    $("best-filter").textContent = `Solo mejoras · ${e.improvements.length}`;
    $("all-filter").classList.toggle("selected", state.filter === "all");
    $("best-filter").classList.toggle("selected", state.filter === "improvements");
  }
  handleClick(event) {
    const state = this.context.state;
    const id = event.target.closest("button")?.id;
    if (id === "follow-toggle") {
      this.follow = !this.follow;
      state.traceSelected = this.follow ? null : state.cursor;
    } else if (id === "all-filter" || id === "best-filter") {
      state.filter = id === "all-filter" ? "all" : "improvements";
      state.traceOffset = 0;
    } else if (id === "csv" || id === "json") {
      this.exportTrace(id);
      return;
    } else {
      const row = event.target.closest("tr[data-index]");
      if (!row) return;
      this.follow = false;
      state.traceSelected = Number(row.dataset.index);
    }
    this.render();
  }
  // Summary row for the hidden span between the first 11 rows and the current row.
  gapRow(engine, cursor) {
    const { number } = this.context;
    const hidden = engine.improvements
      .filter((item) => item.index >= 11 && item.index < cursor)
      .map((item) => `#${number(item.index + 1)}`);
    const improvements = hidden.length ? ` · mejoras en ${hidden.join(", ")}` : "";
    return (
      `<tr><td colspan="5" class="trace-gap">` +
      `··· ${number(cursor - 11)} filas${improvements}</td></tr>`
    );
  }

  exportTrace(type) {
    const { state, letter } = this.context;
    const e = state.engine;
    const parts = [type === "json" ? "[" : "index,route,distance\n"];
    for (let start = 0; start < e.count; start += 10000) {
      const rows = [];
      const end = Math.min(e.count, start + 10000);
      for (let i = start; i < end; i++) {
        const route = e.routeAt(i).map(letter).join("→");
        const row = { index: i + 1, route, distance: e.costs[i] };
        rows.push(
          type === "json" ? JSON.stringify(row) : `${row.index},${row.route},${row.distance}`,
        );
      }
      if (type === "json") {
        parts.push((start ? "," : "") + rows.join(","));
      } else {
        parts.push(rows.join("\n") + "\n");
      }
    }
    if (type === "json") parts.push("]");
    const url = URL.createObjectURL(
      new Blob(parts, { type: type === "json" ? "application/json" : "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `tourbench-trace.${type}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
