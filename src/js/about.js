// Opens the shared "About" dialog from any element marked with data-about-open.
// Used by index.html and landing.html; the dialog markup lives in each page.
document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("about");
  if (!dialog) return;

  document.querySelectorAll("[data-about-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => dialog.showModal());
  });
  dialog.querySelector("[data-about-close]").addEventListener("click", () => dialog.close());

  // Clicking the backdrop (outside the dialog box) closes it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
