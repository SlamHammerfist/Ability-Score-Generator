import { AbilityDialog } from "./ability-dialog.js";

Hooks.on("renderApplication", (app, html) => {
  const actor = app?.actor;
  if (actor?.type === "character") {
    console.log("Assign Abilities: renderApplication fired", app.constructor.name);
  }
});

Hooks.on("renderCharacterActorSheet", (sheet, html) => {
  const actor = sheet.actor;
  if (actor?.type !== "character") return;

  const header = $(html).find(".window-header");
  if (!header.length) return;

  let button = header.find(".assign-abilities-btn");
  if (!button.length) {
    button = $(`
      <button type="button" class="assign-abilities-btn" data-tooltip="Assign Ability Scores">
        <i class="fas fa-dice-d20"></i>
      </button>
    `);

    button.on("click", () => {
      try {
        new AbilityDialog(actor).render(true);
      } catch (err) {
        console.error("Assign Abilities: failed to render dialog", err);
        ui.notifications.error("Unable to open Ability Assignment dialog.");
      }
    });

    header.append(button);
  }

  const isEditMode = sheet.options.editable;
  button.toggle(isEditMode);
});