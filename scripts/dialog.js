import { buildTable, wireDropdowns, wireModeSelector } from "./table.js";
import { pointBuyScores, STANDARD_ARRAY, assignScores, rollAbilityScores } from "./utils.js";

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
  const lockedRef = { value: false };
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
    buttons: [
      {
        label: "Save & Close",
        value: null,
        type: "submit",
        action: "ok"
      }
    ],
    window: {
      title: `Assign Abilities - ${name}`
    },
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

      wireModeSelector(dialogRoot, actor, rolled, assigned, modeRef, updateAssigned, originalScores, lockedRef);

      const assignBtn = dialogRoot.querySelector("#assign-btn");
      const rollBtn = dialogRoot.querySelector("#roll-btn");

      const refreshTable = (originalOverride = originalScores, lockState = lockedRef.value) => {
        const tableDiv = dialogRoot.querySelector("#score-table");
        if (!tableDiv) return;

        const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
        const options =
          modeRef.value === "roll" ? rolled :
          modeRef.value === "standard" ? STANDARD_ARRAY :
          modeRef.value === "pointbuy" ? pointBuyScores : [];

        tableDiv.innerHTML = buildTable(actor, options, assigned, modeRef.value, getCurrentScore, originalOverride, lockState);
        wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore, originalOverride, lockState);
      };

      refreshTable();

      // Roll
      rollBtn?.addEventListener("click", async () => {
        rolled = await rollAbilityScores(actor);
        modeRef.value = "roll";
        refreshTable(originalScores, lockedRef.value);
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
        assignBtn.disabled = false;
        if (rollBtn) rollBtn.disabled = false;
        lockedRef.value = false;
        refreshTable(originalScores, lockedRef.value);
      });

      // Assign
      assignBtn?.addEventListener("click", async () => {
        assignBtn.disabled = true;

        const result = await assignScores(actor, dialogRoot, modeRef.value);

        if (result === "incomplete") {
          ui.notifications.warn("Please assign a score to every ability.");
          assignBtn.disabled = false;
          return;
        }

        if (result === "cancelled") {
          assignBtn.disabled = false;
          return;
        }

        lockedRef.value = true;
        if (rollBtn) rollBtn.disabled = true;
        assigned = {};
        refreshTable(originalScores, lockedRef.value);
      });
    }
  });
};
