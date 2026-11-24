// Small HTML string helpers shared by the inspector, result, trace and dialog views.
// Values passed in are numbers or fixed UI copy; no user-provided text is interpolated.
const Markup = {
  section(title, body, extra = "") {
    return (
      `<section class="section">` +
      `<div class="section-head"><h2>${title}</h2><span class="meta mono">${extra}</span></div>` +
      `${body}</section>`
    );
  },

  stat(label, value) {
    return `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`;
  },

  stats(items, className = "") {
    const cells = items.map(([label, value]) => Markup.stat(label, value)).join("");
    return `<div class="stats ${className}">${cells}</div>`;
  },

  icon(name) {
    return (
      `<svg class="icon" width="16" height="16" aria-hidden="true">` +
      `<use href="assets/icons.svg#icon-${name}"></use></svg>`
    );
  },
};
