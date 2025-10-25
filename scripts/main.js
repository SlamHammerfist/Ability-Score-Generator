import { openAssignDialog } from "./dialog.js";

Hooks.once("init", () => {
  console.log("Assign Abilities | Initializing module");

  Handlebars.registerHelper("ifEquals", (a, b, options) => {
    return a === b ? options.fn(this) : options.inverse(this);
  });
});

Hooks.on("renderCharacterActorSheet", async (sheet) => {
  const actor = sheet.actor;
  if (actor?.type !== "character") return;

  const header = sheet.element.querySelector(".window-header");
  if (!header) return;

  // Remove any existing button to prevent duplicates
  header.querySelector(".assign-abilities-btn")?.remove();

  const button = document.createElement("a");
  button.classList.add("assign-abilities-btn");
  button.dataset.tooltip = "Assign Ability Scores";
  button.innerHTML = `<i class="fas fa-dice-d20"></i>`;

  button.addEventListener("click", async () => {
    try {
      const source = actor ?? canvas.tokens?.controlled[0]?.actor;
      if (!source) {
        ui.notifications.error("No valid actor or token selected.");
        return;
      }
      openAssignDialog(source);
    } catch (err) {
      console.error("Assign Abilities: failed to render dialog", err);
      ui.notifications.error("Unable to open Ability Assignment dialog.");
    }
  });

  header.insertBefore(button, header.firstChild.nextSibling);
});