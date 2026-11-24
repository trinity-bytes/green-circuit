(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Number(n).toFixed(2);
  const number = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const letter = (id) => String.fromCharCode(65 + id);
  const state = {
    n: 8,
    layout: "random",
    speed: 10,
    playing: false,
    edit: false,
    tool: "select",
    tab: "inspector",
    graph: null,
    engine: null,
    cursor: -1,
    cy: null,
    selectedNode: null,
    edge: null,
    filter: "all",
    traceOffset: 0,
    traceSelected: null,
    showWorst: false,
    frame: null,
  };
  const routeText = (route) => (route ? route.map(letter).join(" → ") : "—");
  const routeEdges = (route) => {
    const edges = new Set();
    if (route)
      for (let i = 1; i < route.length; i++)
        edges.add([route[i - 1], route[i]].sort((a, b) => a - b).join("-"));
    return edges;
  };
  const graphView = new GraphView($("graph"), {
    state,
    letter,
    accessRoot: $("graph-access"),
    routeEdges,
    resetEngine,
    render,
    openEdge,
  });
  const drawGraph = () => graphView.draw();
  const colorGraph = () => graphView.highlight();
  function resetEngine() {
    state.playing = false;
    state.toEnd = false;
    if (state.frame) cancelAnimationFrame(state.frame);
    state.engine = new SearchEngine(state.graph);
    state.cursor = -1;
    state.traceSelected = null;
    state.showWorst = false;
  }
  function generate() {
    let nodes;
    if (state.layout === "circular") nodes = RandomGenerator.generateCircularLayout(state.n);
    else if (state.layout === "grid") nodes = RandomGenerator.generateGridLayout(state.n);
    else {
      const seed = new URLSearchParams(location.search).get("seed");
      nodes = RandomGenerator.generate(state.n, seed === null ? {} : { seed: Number(seed) });
    }
    const graph = new Graph(state.n);
    nodes.forEach((n) => graph.addNode(n));
    RandomGenerator.generateCompleteGraph(nodes).forEach((e) =>
      graph.addEdge(e.from, e.to, e.distance),
    );
    state.graph = graph;
    resetEngine();
    drawGraph();
    render();
  }
  const editor = new EditMode(
    {
      title: $("edge-title"),
      weight: $("edge-weight"),
      position: $("edge-position"),
      dialog: $("edge-dialog"),
      tools: $("tools"),
    },
    { state, letter, resetEngine, drawGraph, render },
  );
  function openEdge() {
    editor.openEdge();
  }
  const resultPanel = new ResultPanel({ fmt, number, routeText });
  const inspector = new Inspector(
    $("inspector"),
    {
      state,
      number,
      fmt,
      letter,
      routeText,
      routeEdges,
    },
    resultPanel,
  );
  const renderInspector = () => inspector.render();
  const tracePanel = new TracePanel($("trace"), {
    state,
    number,
    fmt,
    letter,
  });
  const renderTrace = () => tracePanel.render();
  const shellIds = [
    "node-count",
    "complexity",
    "restart",
    "instance",
    "progress-text",
    "improvement-count",
    "progress-fill",
    "playhead",
    "ticks",
    "track",
    "play",
    "minus",
    "plus",
    "regenerate",
    "edit",
    "layouts",
    "speeds",
    "tools",
    "trace-count",
    "inspector",
    "trace",
    "inspector-tab",
    "trace-tab",
    "legend",
    "canvas-help",
  ];
  const roots = Object.fromEntries(shellIds.map((id) => [id, $(id)]));
  const appView = new AppView(roots, {
    state,
    number,
    fmt,
    renderInspector,
    renderTrace,
    colorGraph,
  });
  function render() {
    appView.render();
  }
  const playback = new Playback(
    {
      announcement: $("announcement"),
      confirmStats: $("confirm-stats"),
      dialog: $("confirm"),
    },
    { state, render, resetEngine, number, fmt },
  );
  const toggle = () => playback.toggle();
  const begin = () => playback.begin();
  const tick = () => playback.tick();
  const navigate = (index) => playback.navigate(index);
  $("play").onclick = toggle;
  $("confirm-run").onclick = () => {
    $("confirm").close();
    begin();
  };
  $("cancel").onclick = () => $("confirm").close();
  $("edge-cancel").onclick = () => editor.restoreEdge();
  $("edge-apply").onclick = () => editor.applyEdge();
  $("first").onclick = () => navigate(0);
  $("prev").onclick = () => navigate(state.cursor - 1);
  $("next").onclick = () => navigate(state.cursor + 1);
  $("last").onclick = () => {
    if (state.playing) return;
    state.playing = true;
    state.toEnd = true;
    tick();
  };
  $("track").onclick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    navigate(Math.floor(((event.clientX - rect.left) / rect.width) * (state.engine.capacity - 1)));
  };
  $("plus").onclick = () => {
    if (state.n < 11) {
      state.n++;
      generate();
    }
  };
  $("minus").onclick = () => {
    if (state.n > 4) {
      state.n--;
      generate();
    }
  };
  $("regenerate").onclick = generate;
  $("restart").onclick = () => {
    resetEngine();
    render();
  };
  $("layouts").onclick = (e) => {
    const b = e.target.closest("[data-layout]");
    if (!b) return;
    state.layout = b.dataset.layout;
    $("layouts")
      .querySelectorAll("button")
      .forEach((x) => x.classList.toggle("selected", x === b));
    generate();
  };
  $("speeds").onclick = (e) => {
    const b = e.target.closest("[data-speed]");
    if (!b) return;
    state.speed = b.dataset.speed;
    $("speeds")
      .querySelectorAll("button")
      .forEach((x) => x.classList.toggle("selected", x === b));
  };
  $("edit").onclick = () => {
    state.edit = !state.edit;
    state.playing = false;
    render();
  };
  $("tools").onclick = (event) => editor.selectTool(event.target.closest("[data-tool]"));
  $("inspector-tab").onclick = () => {
    state.tab = "inspector";
    render();
  };
  $("trace-tab").onclick = () => {
    state.tab = "trace";
    render();
  };
  $("zoom-in").onclick = () => state.cy?.zoom(state.cy.zoom() * 1.2);
  $("zoom-out").onclick = () => state.cy?.zoom(state.cy.zoom() / 1.2);
  $("fit").onclick = () => state.cy?.fit(undefined, 45);
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea,select") || document.querySelector("dialog[open]")) return;
    const actions = {
      " ": toggle,
      ArrowLeft: () => navigate(state.cursor - 1),
      ArrowRight: () => navigate(state.cursor + 1),
      Home: () => navigate(0),
      End: () => $("last").click(),
      1: () => $("inspector-tab").click(),
      2: () => $("trace-tab").click(),
      e: () => $("edit").click(),
      v: () => document.querySelector("[data-tool=select]").click(),
      n: () => document.querySelector("[data-tool=node]").click(),
      a: () => document.querySelector("[data-tool=edge]").click(),
      Delete: () => document.querySelector("[data-tool=delete]").click(),
    };
    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth < 1024)
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  });
  generate();
})();
