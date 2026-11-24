// Cytoscape rendering of the graph: nodes, edges, route highlighting and weight labels.
class GraphView {
  constructor(root, context) {
    this.root = root;
    this.context = context;
  }
  // Cytoscape renders to canvas and cannot read CSS custom properties, so resolve the
  // Latte tokens from tokens.css once per draw.
  static palette() {
    const css = getComputedStyle(document.documentElement);
    const token = (name) => css.getPropertyValue(`--latte-${name}`).trim();
    return {
      base: token("base"),
      text: token("text"),
      surface1: token("surface1"),
      surface2: token("surface2"),
      blue: token("blue"),
      green: token("green"),
      red: token("red"),
    };
  }

  draw() {
    const { state, letter, resetEngine, render, openEdge } = this.context;
    if (!window.cytoscape) return;
    if (state.cy) state.cy.destroy();
    const color = GraphView.palette();
    const nodes = state.graph.nodes.map((n) => ({
      data: { id: String(n.id), label: letter(n.id) },
      position: { x: n.x, y: n.y },
    }));
    const edges = state.graph.edges.map((e) => ({
      data: {
        id: `${e.from}-${e.to}`,
        source: String(e.from),
        target: String(e.to),
        weight: Number(e.distance).toFixed(2),
      },
    }));
    state.cy = cytoscape({
      container: this.root,
      elements: [...nodes, ...edges],
      layout: { name: "preset", fit: true, padding: 45 },
      minZoom: 0.3,
      maxZoom: 3,
      style: [
        {
          selector: "node",
          style: {
            "background-color": color.base,
            "border-width": 1.5,
            "border-color": color.text,
            label: "data(label)",
            width: 32,
            height: 32,
            "font-size": 12,
            "font-family": "IBM Plex Mono, monospace",
            "text-valign": "center",
            "text-halign": "center",
            color: color.text,
          },
        },
        {
          selector: 'node[id="0"]',
          style: {
            "background-color": color.text,
            color: color.base,
            "border-width": 3,
            "border-color": color.surface1,
          },
        },
        {
          selector: "edge",
          style: { width: 1, "line-color": color.surface2, "curve-style": "straight" },
        },
        {
          selector: "node.keyboard-focus",
          style: {
            "underlay-color": color.blue,
            "underlay-padding": 4,
            "underlay-opacity": 1,
            "underlay-shape": "ellipse",
          },
        },
        {
          selector: "node.edit-selected",
          style: { "border-color": color.blue, "border-width": 2 },
        },
        {
          selector: "edge.edit-selected",
          style: {
            width: 2,
            "line-color": color.blue,
            color: color.text,
            label: "data(weight)",
            "font-family": "IBM Plex Mono, monospace",
            "text-background-color": color.base,
            "text-background-opacity": 1,
            "text-background-padding": 3,
          },
        },
        { selector: "edge.best", style: { width: 2, "line-color": color.green } },
        {
          selector: "edge.current",
          style: {
            width: 2,
            "line-color": color.blue,
            color: color.text,
            label: "data(weight)",
            "font-size": 12,
            "font-family": "IBM Plex Mono, monospace",
            "text-background-color": color.base,
            "text-background-opacity": 1,
            "text-background-padding": 3,
          },
        },
        {
          selector: "edge.worst",
          style: { width: 2, "line-color": color.red, "line-style": "dashed" },
        },
      ],
    });
    // Cytoscape font sizes scale with zoom; keep edge labels at 12 screen pixels.
    const updateEdgeLabelSize = () => {
      state.cy.edges().style("font-size", 12 / state.cy.zoom());
    };
    state.cy.on("zoom", updateEdgeLabelSize);
    updateEdgeLabelSize();
    state.cy.on("tap", "node", (event) => {
      const id = Number(event.target.id());
      if (!state.edit) return;
      if (state.tool === "select") {
        state.selectedNode = id;
        render();
      }
      if (state.tool === "delete") {
        if (state.graph.nodes.length <= 4) return;
        state.graph.nodes = state.graph.nodes.filter((n) => n.id !== id);
        state.graph.edges = state.graph.edges.filter((e) => e.from !== id && e.to !== id);
        state.n = state.graph.nodes.length;
        resetEngine();
        this.draw();
        render();
      } else if (state.tool === "edge") {
        if (state.selectedNode === null) state.selectedNode = id;
        else if (state.selectedNode !== id) {
          state.edge = [state.selectedNode, id];
          state.selectedNode = null;
          openEdge();
        }
      }
    });
    state.cy.on("tap", "edge", (event) => {
      if (!state.edit) return;
      const edge = event.target;
      state.edge = [Number(edge.source().id()), Number(edge.target().id())];
      if (state.tool === "delete") {
        state.graph.edges = state.graph.edges.filter(
          (e) => ![`${e.from}-${e.to}`, `${e.to}-${e.from}`].includes(state.edge.join("-")),
        );
        resetEngine();
        this.draw();
        render();
      }
    });
    state.cy.on("dbltap", "edge", (event) => {
      if (!state.edit || state.tool === "delete") return;
      state.edge = [Number(event.target.source().id()), Number(event.target.target().id())];
      state.selectedNode = state.edge[0];
      render();
      openEdge();
    });
    state.cy.on("dragfree", "node", (event) => {
      const n = state.graph.nodes.find((n) => String(n.id) === event.target.id());
      if (n) {
        n.x = event.target.position("x");
        n.y = event.target.position("y");
      }
    });
    state.cy.on("tap", (event) => {
      if (
        state.edit &&
        state.tool === "node" &&
        event.target === state.cy &&
        state.graph.nodes.length < 11
      ) {
        const id = Math.max(...state.graph.nodes.map((n) => n.id)) + 1;
        state.graph.addNode({ id, x: event.position.x, y: event.position.y });
        state.n = state.graph.nodes.length;
        resetEngine();
        this.draw();
        render();
      }
    });
    this.syncAccessibleNodes();
    this.highlight();
  }
  syncAccessibleNodes() {
    const { state, letter, accessRoot, openEdge, render } = this.context;
    accessRoot.replaceChildren();
    state.graph.nodes.forEach((node) => {
      const button = document.createElement("button");
      const degree = state.graph.edges.filter(
        (edge) => edge.from === node.id || edge.to === node.id,
      ).length;
      button.setAttribute("aria-label", `Nodo ${letter(node.id)}, grado ${degree}`);
      button.addEventListener("focus", () => {
        state.cy.nodes().removeClass("keyboard-focus");
        state.cy.getElementById(String(node.id)).addClass("keyboard-focus");
      });
      button.addEventListener("blur", () => state.cy.nodes().removeClass("keyboard-focus"));
      button.addEventListener("click", () => {
        if (!state.edit) return;
        if (state.selectedNode !== null && state.selectedNode !== node.id) {
          state.edge = [state.selectedNode, node.id];
          render();
          openEdge();
        } else {
          state.selectedNode = node.id;
          render();
        }
      });
      accessRoot.append(button);
    });
  }
  highlight() {
    const { state, routeEdges } = this.context;
    if (!state.cy) return;
    const current = routeEdges(state.cursor >= 0 ? state.engine.routeAt(state.cursor) : null),
      best = routeEdges(state.edit ? null : state.engine.best?.route),
      worst = routeEdges(state.showWorst ? state.engine.worst?.route : null);
    state.cy.nodes().forEach((node) => {
      const selected =
        state.edit &&
        (Number(node.id()) === state.selectedNode ||
          (state.edge && state.edge.includes(Number(node.id()))));
      node.toggleClass("edit-selected", Boolean(selected));
    });
    state.cy.edges().forEach((edge) => {
      const key = [Number(edge.source().id()), Number(edge.target().id())]
        .sort((a, b) => a - b)
        .join("-");
      const selected =
        state.edit &&
        state.edge &&
        [edge.source().id(), edge.target().id()].sort().join("-") ===
          state.edge.map(String).sort().join("-");
      edge.toggleClass("edit-selected", Boolean(selected));
      edge.toggleClass("best", best.has(key));
      edge.toggleClass("current", !state.edit && !state.engine.done && current.has(key));
      edge.toggleClass("worst", worst.has(key));
    });
  }
}
