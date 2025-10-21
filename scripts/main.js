Hooks.once("init", () => {
  console.log("Assign Abilities | Initializing module");

  Handlebars.registerHelper("ifEquals", (a, b, options) => {
    return a === b ? options.fn(this) : options.inverse(this);
  });
});

Hooks.on("renderCharacterActorSheet", (sheet, html) => {
  const actor = sheet.actor;
  if (actor?.type !== "character") return;

  const $html = $(html);
  const controls = $html.find(".window-header");
  if (!controls.length) return;

  // Remove any existing button to prevent duplicates
  controls.find(".assign-abilities-btn").remove();

  const button = $(`
    <a class="assign-abilities-btn" data-tooltip="Assign Ability Scores">
      <i class="fas fa-dice-d20"></i>
    </a>
  `);

  button.on("click", async () => {
    try {
      const { openAssignDialog } = await import("./dialog.js");
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

  controls.append(button);
});