// Result view: optimal route, metrics, comparison with the worst route and improvements.
class ResultPanel {
  constructor(context) {
    this.context = context;
  }

  render(engine) {
    const { fmt, number, routeText } = this.context;
    const section = Markup.section;
    const best = engine.best;
    const worst = engine.worst;
    const metrics = SearchEngine.metrics(best.cost);
    const difference = worst.cost - best.cost;
    const saving = SearchEngine.metrics(difference);
    const edges = best.route
      .slice(1)
      .map((node, index) => fmt(engine.graph.getDistance(best.route[index], node)));
    const first = edges.slice(0, 4).join(" + ");
    const second = edges.slice(4).join(" + ");
    const optimal =
      `<p class="route best-block">${routeText(best.route)}</p>` +
      Markup.stats(
        [
          ["DISTANCIA", `${fmt(best.cost)} km`],
          ["TIEMPO", `${fmt(metrics.time)} min`],
          ["CO₂", `${fmt(metrics.co2)} kg`],
        ],
        "result-values",
      ) +
      `<div class="formula mono">d = ${first}<br> + ${second} = ${fmt(best.cost)} km<br>` +
      `t = d / 25 km/h × 60 = ${fmt(metrics.time)} min<br>` +
      `CO₂ = d × 0.2 kg/km = ${fmt(metrics.co2)} kg</div>`;
    const reduction = ((difference / worst.cost) * 100).toFixed(1);
    const comparison =
      Markup.stats([
        ["AHORRO", `${fmt(difference)} km`],
        ["REDUCCIÓN", `${reduction} %`],
        ["TIEMPO", `−${saving.time.toFixed(1)} min`],
        ["CO₂", `−${fmt(saving.co2)} kg`],
      ]) +
      `<div class="range-bar"><span></span><span></span><span></span></div>` +
      `<div class="range-label mono">` +
      `<span>${fmt(best.cost)} mín</span><span>${fmt(engine.average)} media</span>` +
      `<span>${fmt(worst.cost)} máx</span></div>`;
    const rows = engine.improvements
      .map((item, index) => {
        const previous = index ? engine.improvements[index - 1].cost : null;
        const delta = SearchEngine.traceDelta(item.index, item.cost, previous);
        const selected = item.index === best.index ? ' class="optimal"' : "";
        return (
          `<tr${selected}><td class="trace-mark">●</td>` +
          `<td class="align-right">${number(item.index + 1)}</td>` +
          `<td>${routeText(engine.routeAt(item.index)).replaceAll(" ", "")}</td>` +
          `<td>${fmt(item.cost)}</td><td>${delta}</td></tr>`
        );
      })
      .join("");
    return (
      section("RUTA ÓPTIMA", optimal, `#${number(best.index + 1)} de ${number(engine.count)}`) +
      section(
        "FRENTE A LA PEOR RUTA",
        comparison,
        `#${number(worst.index + 1)} · ${fmt(worst.cost)} km`,
      ) +
      section(
        "MEJORAS DEL ÓPTIMO",
        `<div class="improvements-scroll">` +
          `<table class="trace-table"><tbody>${rows}</tbody></table></div>`,
        `${engine.improvements.length} de ${number(engine.count)} ciclos`,
      )
    );
  }
}
