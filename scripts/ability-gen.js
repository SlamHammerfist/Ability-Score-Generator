import { openAbilityDialog } from "./ability-dialog.js";

Hooks.on("renderActorDirectory", (app, htmlElement) => {
  const html = $(htmlElement);
  const headerActions = html.find(".header-actions").first();
  if (!headerActions.length) return;

  const assignButton = $(`
    <button type="button" class="assign-abilities-btn" style="margin-top: 6px;">
      <i class="fas fa-dice-d20"></i> Assign Abilities
    </button>
  `);

  assignButton.on("click", async () => {
    const selected = canvas.tokens.controlled[0]?.actor ?? game.user.character;
    if (!selected || selected.type !== "character") {
      return ui.notifications.warn("Assign or Select a character token first.");
    }
    openAbilityDialog(selected);
  });

  const createButton = headerActions.find("button.create-entity").first();
  if (createButton.length) {
    createButton.after(assignButton);
  } else {
    headerActions.append(assignButton);
  }

});
