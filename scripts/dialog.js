import { buildTable, wireDropdowns, wireModeSelector } from "./table.js";
import { pointBuyScores, STANDARD_ARRAY, applyScores, rollAbilityScores } from "./utils.js";

export const openAssignDialog = async (source, initialRolled = [], mode = "roll", preservedPosition = undefined) => {
  const actor = source?.actor ?? (source?.type === "character" ? source : null);
  if (!actor || !actor.system?.abilities) {
    ui.notifications.error("Unable to open ability assignment dialog: no valid actor found.");
    return;
  }

  const name = actor.name ?? "Unknown";
  let rolled = initialRolled;
  let assigned = {};
  const modeRef = { value: mode };
  let dialogRoot;

  const updateAssigned = (a) => { assigned = a; };

  const originalScores = {};
  const abilities = Object.keys(actor.system.abilities || {});
  abilities.forEach(abl => {
    originalScores[abl] = actor.system.abilities?.[abl]?.value ?? 10;
  });

  const html = await foundry.applications.handlebars.renderTemplate(
    "modules/ability-score-generator/templates/assign-abilities.hbs",
    {
      mode: modeRef.value,
      actorName: name
    }
  );

  await foundry.applications.api.Dialog.prompt({
    id: "assign-abilities-dialog",
    content: html,
    buttons: [], // no native footer
    options: {
      submitOnChange: false,
      closeOnSubmit: false,
      top: preservedPosition?.top,
      left: preservedPosition?.left,
      classes: ["assign-abilities-dialog"]
    },
    render: async () => {
      dialogRoot = document.querySelector("#assign-abilities-dialog");
      if (!dialogRoot) return;

      wireModeSelector(dialogRoot, actor, rolled, assigned, modeRef, updateAssigned);

      const tableDiv = dialogRoot.querySelector("#score-table");
      const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
      const options =
        modeRef.value === "roll" ? rolled :
        modeRef.value === "standard" ? STANDARD_ARRAY :
        modeRef.value === "pointbuy" ? pointBuyScores : [];

      tableDiv.innerHTML = buildTable(actor, options, assigned, modeRef.value, getCurrentScore);
      wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore);

      // Roll Again
      dialogRoot.querySelector("#roll-btn")?.addEventListener("click", async () => {
        rolled = await rollAbilityScores(actor);
        modeRef.value = "roll";

        const tableDiv = dialogRoot.querySelector("#score-table");
        if (tableDiv) {
          const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
          tableDiv.innerHTML = buildTable(actor, rolled, assigned, modeRef.value, getCurrentScore);
          wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore);
        }
      });

      // Reset
      dialogRoot.querySelector("#reset-btn")?.addEventListener("click", async () => {
        const restore = {};
        for (const [abl, val] of Object.entries(originalScores)) {
          restore[`system.abilities.${abl}.value`] = val;
        }
        await actor.update(restore);
        ui.notifications.info("Ability scores reset to original values.");

        assigned = {};
        const tableDiv = dialogRoot.querySelector("#score-table");
        if (tableDiv) {
          const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
          const options =
            modeRef.value === "roll" ? rolled :
            modeRef.value === "standard" ? STANDARD_ARRAY :
            modeRef.value === "pointbuy" ? pointBuyScores : [];

          tableDiv.innerHTML = buildTable(actor, options, assigned, modeRef.value, getCurrentScore);
          wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore);
        }
      });

      // Apply
      dialogRoot.querySelector("#apply-btn")?.addEventListener("click", async () => {
        const result = await applyScores(actor, dialogRoot, modeRef.value);
        if (result === "incomplete") {
          ui.notifications.warn("Please assign a score to every ability before applying.");
          return;
        }

        const tableDiv = dialogRoot.querySelector("#score-table");
        if (tableDiv) {
          const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
          const options =
            modeRef.value === "roll" ? rolled :
            modeRef.value === "standard" ? STANDARD_ARRAY :
            modeRef.value === "pointbuy" ? pointBuyScores : [];

          tableDiv.innerHTML = buildTable(actor, options, assigned, modeRef.value, getCurrentScore);
          wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore);
        }
      });
    }
  });
};