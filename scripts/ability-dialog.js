import { renderAssignmentTable } from "./assignment-table.js";

export async function openAbilityDialog(actor) {
  const abilities = Object.keys(actor.system.abilities);
  let rolledScores = [];

  const html = `
    <form>
      <label for="ability-gen-mode"><strong>Generation Mode:</strong></label>
      <select id="ability-gen-mode" style="margin-bottom: 1em;">
        <option value="roll">Roll</option>
        <option value="array">Standard Array</option>
        <option value="buy">Point Buy</option>
      </select>
      <div id="ability-gen-table" style="margin-bottom: 1em;"></div>
      <div class="ability-gen-footer-row" style="display: flex; gap: 0.5em; justify-content: flex-end;">
        <button type="button" class="roll-dice-btn">Roll</button>
        <button type="button" class="reset-btn">Reset</button>
        <button type="submit" class="apply-btn">Apply</button>
      </div>
    </form>
  `;

  const dialog = new Dialog({
    title: "Assign Ability Scores",
    content: html,
    buttons: {},
    classes: ["ability-gen-dialog"]
  }, {
    width: 300,
    height: 385
  });

  dialog.render(true);

  Hooks.once("renderDialog", (dialogInstance, $html) => {
    const form = $html.find("form")[0];
    const tableWrapper = $html.find("#ability-gen-table")[0];
    const modeSelector = $html.find("#ability-gen-mode");
    const rollButton = $html.find(".roll-dice-btn");

    function updateRollVisibility() {
      rollButton.toggle(modeSelector.val() === "roll");
    }

    async function rollScores(label = "Rolled Ability Scores") {
      rolledScores = [];
      const rollObjects = [];

      for (let i = 0; i < 6; i++) {
        const r = new Roll("4d6kh3");
        await r.evaluate();
        rolledScores.push(r.total);
        rollObjects.push(r);
      }

      const rollList = rolledScores.map((r, i) => `<li>Score ${i + 1}: <strong>${r}</strong></li>`).join("");

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p><strong>${label}:</strong></p><ul>${rollList}</ul>`,
        rolls: rollObjects,
        flags: { "dice-so-nice": { showRoll: true } }
      });

      renderAssignmentTable(tableWrapper, abilities, rolledScores, "roll");
    }

    modeSelector.on("change", () => {
      updateRollVisibility();
      const mode = modeSelector.val();
      if (mode === "roll") {
        renderAssignmentTable(tableWrapper, abilities, rolledScores, "roll");
      } else if (mode === "array") {
        renderAssignmentTable(tableWrapper, abilities, [15, 14, 13, 12, 10, 8], "array");
      } else {
        renderAssignmentTable(tableWrapper, abilities, Array.from({ length: 8 }, (_, i) => i + 8), "buy");
      }
    });

    $html.find(".roll-dice-btn").on("click", () => rollScores("Rolled Ability Scores"));

    $html.find(".reset-btn").on("click", () => {
      const mode = modeSelector.val();

      if (mode !== "roll") {
        rolledScores = [];
      }

      for (const input of form.querySelectorAll("select[name]")) {
        input.value = "";
      }
      
      for (const mod of form.querySelectorAll(".mod-preview")) {
        mod.textContent = "";
      }

      const source = mode === "roll" ? rolledScores
                   : mode === "array" ? [15, 14, 13, 12, 10, 8]
                   : Array.from({ length: 8 }, (_, i) => i + 8);

      renderAssignmentTable(tableWrapper, abilities, source, mode);
    });

    $html.find(".apply-btn").on("click", event => {
      event.preventDefault();
      const mode = modeSelector.val();

      const scores = abilities.map(a => {
        const input = form.querySelector(`[name="${a}"]`);
        return input ? Number(input.value) : undefined;
      });

      if (scores.some(s => s === undefined || isNaN(s))) {
        return ui.notifications.error("All abilities must be assigned.");
      }

      if (mode === "roll") {
        const assignedCounts = {};
        for (const val of scores) assignedCounts[val] = (assignedCounts[val] || 0) + 1;

        const rolledCounts = {};
        for (const val of rolledScores) rolledCounts[val] = (rolledCounts[val] || 0) + 1;

        for (const [score, count] of Object.entries(assignedCounts)) {
          if (count > (rolledCounts[score] || 0)) {
            return ui.notifications.error(`Score ${score} used too many times.`);
          }
        }
      }

      if (mode === "buy") {
        const costTable = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
        const totalCost = scores.reduce((sum, val) => sum + (costTable[val] ?? 100), 0);

        if (totalCost > 27) {
          return ui.notifications.error(`Point buy total exceeds 27 (used ${totalCost}).`);
        }

        if (totalCost < 27) {
          const remaining = 27 - totalCost;
          return Dialog.confirm({
            title: "Unspent Points",
            content: `<p>You still have <strong>${remaining}</strong> unspent point${remaining === 1 ? "" : "s"}. Are you sure you want to apply?</p>`,
            yes: async () => {
              const updates = {};
              for (let i = 0; i < abilities.length; i++) {
                updates[`system.abilities.${abilities[i]}.value`] = scores[i];
              }
              await actor.update(updates);
              ui.notifications.info("Ability scores updated.");
              dialogInstance.close();
            },
            no: () => {},
            defaultYes: false
          });
        }
      }

      const updates = {};
      for (let i = 0; i < abilities.length; i++) {
        updates[`system.abilities.${abilities[i]}.value`] = scores[i];
      }

      actor.update(updates);
      ui.notifications.info("Ability scores updated.");
      dialogInstance.close();
    });

    updateRollVisibility();
    renderAssignmentTable(tableWrapper, abilities, rolledScores, "roll");
  });
}