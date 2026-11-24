class Playback {
  constructor(roots, context) {
    this.announcement = roots.announcement;
    this.confirmStats = roots.confirmStats;
    this.dialog = roots.dialog;
    this.context = context;
  }
  advance(amount) {
    const { state, render, fmt } = this.context;
    const e = state.engine,
      previous = e.improvements.length;
    e.step(amount);
    state.cursor = e.count - 1;
    if (e.improvements.length > previous)
      this.announcement.textContent = `Nueva mejor ruta: ${fmt(e.best.cost)} kilómetros`;
    if (e.done) {
      state.playing = false;
      state.toEnd = false;
      if (e.error) state.cursor = -1;
    }
    render();
  }
  tick() {
    const { state } = this.context;
    if (!state.playing) return;
    this.advance(state.toEnd || state.speed === "max" ? 10000 : Number(state.speed));
    if (state.playing) state.frame = requestAnimationFrame(() => this.tick());
  }
  begin() {
    const { state, render, resetEngine } = this.context;
    if (state.edit) return;
    if (state.engine.done) resetEngine();
    state.playing = true;
    render();
    state.frame = requestAnimationFrame(() => this.tick());
  }
  toggle() {
    const { state, render, number } = this.context;
    if (state.playing) {
      state.playing = false;
      state.toEnd = false;
      cancelAnimationFrame(state.frame);
      render();
    } else if (state.n >= 10 && !state.engine.count) {
      const engine = state.engine;
      this.confirmStats.innerHTML = Markup.stats([
        ["CICLOS", number(engine.capacity)],
        ["TIEMPO EST.", engine.estimatedTime],
        ["MEMORIA", `~${Number(engine.memoryMB.toPrecision(2))} MB`],
      ]);
      this.dialog.querySelector("#confirm-title").textContent = `Ejecutar con N = ${state.n}`;
      this.dialog.showModal();
    } else this.begin();
  }
  navigate(index) {
    const { state, render } = this.context;
    if (state.playing) return;
    const e = state.engine;
    if (index >= e.count && !e.done) e.step(index - e.count + 1);
    state.cursor = Math.max(-1, Math.min(index, e.count - 1));
    render();
  }
}
