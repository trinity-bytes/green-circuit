// Enumerates tours without retaining their paths; the graph is independent of the UI.
class SearchEngine {
  constructor(graph) {
    this.graph = graph;
    this.nodes = graph.nodes
      .map((node) => node.id)
      .sort((a, b) =>
        typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b)),
      );
    const started = SearchEngine.now();
    this.matrix = this.nodes.map((a) => this.nodes.map((b) => graph.getDistance(a, b)));
    this.phaseOneMs = SearchEngine.now() - started;
    this.elapsedMs = 0;
    this.capacity = SearchEngine.factorial(Math.max(0, this.nodes.length - 1));
    this.costs = new Float32Array(this.capacity);
    this.count = 0;
    this.sum = 0;
    this.best = null;
    this.worst = null;
    this.improvements = [];
    this.error = null;
    this.path = [0];
    this.iterator = this.tours(this.path);
  }

  static now() {
    return typeof performance === "undefined" ? Date.now() : performance.now();
  }

  get rate() {
    return this.elapsedMs > 0 ? this.count / (this.elapsedMs / 1000) : 100000;
  }

  get memoryMB() {
    return (this.capacity * 4) / 1024 / 1024;
  }

  get estimatedTime() {
    let value = this.capacity / this.rate;
    let unit = "s";
    if (value >= 3600) {
      value /= 3600;
      unit = "h";
    } else if (value >= 60) {
      value /= 60;
      unit = "min";
    }
    return `~${Number(value.toPrecision(2))} ${unit}`;
  }

  static factorial(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
  static metrics(distance) {
    return {
      time: Number(((distance / 25) * 60).toFixed(2)),
      co2: Number((distance * 0.2).toFixed(2)),
    };
  }

  static traceDelta(index, cost, previousBest) {
    if (index === 0 || previousBest === null) return "—";
    const delta = cost - previousBest;
    const magnitude = Math.abs(delta) < 0.005 ? 0 : Math.abs(delta);
    return `${delta < -0.005 ? "−" : "+"}${magnitude.toFixed(2)}`;
  }

  *tours(path = [0]) {
    const nodes = this.nodes;
    if (!nodes.length) return;
    const matrix = this.matrix;
    function* visit(path, used, cost) {
      if (path.length === nodes.length) {
        const closing = matrix[path[path.length - 1]][0];
        if (closing !== null) yield cost + closing;
        return;
      }
      const previous = path[path.length - 1];
      for (let i = 1; i < nodes.length; i++) {
        const distance = matrix[previous][i];
        if (!used[i] && distance !== null) {
          used[i] = true;
          path.push(i);
          yield* visit(path, used, cost + distance);
          path.pop();
          used[i] = false;
        }
      }
    }
    yield* visit(path, [true], 0);
  }

  step(limit = 1) {
    const started = SearchEngine.now();
    for (let i = 0; i < limit && !this.done; i++) {
      const next = this.iterator.next();
      if (next.done) {
        this.done = true;
        if (!this.count) this.error = "no Hamiltonian cycle";
        break;
      }
      const cost = next.value;
      const index = this.count++;
      this.costs[index] = cost;
      this.sum += cost;
      if (!this.best || cost < this.best.cost) {
        this.best = { index, cost, route: this.copyRoute(this.path) };
        this.improvements.push({ index, cost });
      }
      if (!this.worst || cost > this.worst.cost) {
        this.worst = { index, cost, route: this.copyRoute(this.path) };
      }
    }
    this.elapsedMs += SearchEngine.now() - started;
    return this.count;
  }

  copyRoute(path) {
    return [...path.map((index) => this.nodes[index]), this.nodes[0]];
  }

  run() {
    while (!this.done) this.step(10000);
    return this;
  }
  get average() {
    return this.count ? this.sum / this.count : 0;
  }
  routeAt(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) return null;
    if (this.graph.isComplete()) {
      let rank = index;
      const remaining = this.nodes.slice(1),
        route = [this.nodes[0]];
      while (remaining.length) {
        const size = SearchEngine.factorial(remaining.length - 1);
        const choice = Math.floor(rank / size);
        rank %= size;
        route.push(remaining.splice(choice, 1)[0]);
      }
      route.push(this.nodes[0]);
      return route;
    }
    let current = 0;
    const path = [0];
    for (const cost of this.tours(path)) {
      if (current++ === index) return this.copyRoute(path);
    }
    return null;
  }
}
