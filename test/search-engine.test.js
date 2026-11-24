const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ctx = vm.createContext({ Float32Array });
for (const f of ["Graph.js", "SearchEngine.js"])
  vm.runInContext(fs.readFileSync(`src/js/${f}`, "utf8"), ctx);
const { Graph, SearchEngine } = vm.runInContext("({ Graph, SearchEngine })", ctx);
function graph(n) {
  const g = new Graph(n);
  for (let i = 0; i < n; i++) g.addNode({ id: i });
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) g.addEdge(i, j, (i + j + 1) / 2);
  return g;
}
function reference(g) {
  const routes = [];
  function visit(path, left) {
    if (!left.length) {
      const route = [...path, 0];
      routes.push({
        route,
        cost: route.slice(1).reduce((sum, node, i) => sum + g.getDistance(route[i], node), 0),
      });
      return;
    }
    left.forEach((n, i) => visit([...path, n], [...left.slice(0, i), ...left.slice(i + 1)]));
  }
  visit(
    [0],
    g.nodes.slice(1).map((n) => n.id),
  );
  return routes;
}
test("streams complete graphs and matches the naive optimum for N=4..8", () => {
  for (let n = 4; n <= 8; n++) {
    const g = graph(n);
    const expected = reference(g);
    const engine = new SearchEngine(g);
    engine.run();
    assert.equal(engine.count, expected.length);
    assert.equal(engine.best.cost, Math.min(...expected.map((x) => x.cost)));
  }
});
test("reconstructs cycles in enumeration order", () => {
  const g = graph(6);
  const expected = reference(g);
  const engine = new SearchEngine(g);
  engine.run();
  for (const k of [0, 1, 7, 59, 119])
    assert.deepEqual(Array.from(engine.routeAt(k)), expected[k].route);
});
test("keeps a Float32 cost buffer instead of a route array", () => {
  const engine = new SearchEngine(graph(7));
  engine.run();
  assert.ok(engine.costs instanceof Float32Array);
  assert.equal(engine.costs.length, 720);
  assert.ok(
    !Object.values(engine).some((x) => Array.isArray(x) && x.length === 720 && Array.isArray(x[0])),
  );
});
test("reports no Hamiltonian cycle for a degree-one vertex", () => {
  const g = graph(4);
  g.edges = g.edges.filter((e) => e.to !== 3 || e.from === 0);
  const engine = new SearchEngine(g);
  assert.doesNotThrow(() => engine.run());
  assert.equal(engine.error, "no Hamiltonian cycle");
});
test("rounds time, emissions and savings from distance", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(SearchEngine.metrics(18.16))), {
    time: 43.58,
    co2: 3.63,
  });
  assert.equal(SearchEngine.metrics(18.16 - 38.88).co2, -4.14);
});

test("seeded random layouts are reproducible", () => {
  vm.runInContext(fs.readFileSync("src/js/RandomGenerator.js", "utf8"), ctx);
  const generator = vm.runInContext("RandomGenerator", ctx);
  const first = JSON.stringify(generator.generate(8, { seed: 7 }));
  assert.equal(JSON.stringify(generator.generate(8, { seed: 7 })), first);
  assert.notEqual(JSON.stringify(generator.generate(8, { seed: 8 })), first);
});

test("trace delta compares with the best before the row", () => {
  assert.equal(SearchEngine.traceDelta(0, 10, null), "—");
  assert.equal(SearchEngine.traceDelta(1, 8, 10), "−2.00");
  assert.equal(SearchEngine.traceDelta(2, 11, 10), "+1.00");
  assert.equal(SearchEngine.traceDelta(3, 10, 10), "+0.00");
});

test("enumerates N=10 without materializing per-tour routes", () => {
  const engine = new SearchEngine(graph(10));
  const yielded = engine.tours().next().value;
  assert.equal(typeof yielded, "number");
  engine.run();
  assert.equal(engine.count, 362880);
  assert.equal(engine.best.route.length, 11);
});
