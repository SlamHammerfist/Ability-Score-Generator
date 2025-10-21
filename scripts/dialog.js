import { buildTable } from "./table.js";
import { modifier, pointBuyCost, pointBuyScores } from "./utils.js";

export const openAssignDialog = async (token, initialRolled = [], mode = "roll", preservedPosition = undefined) => {
  let rolled = initialRolled;
  let assigned = {};
  let currentMode = mode;
  let dialogRoot;

  const applyScores = async () => {
    const abilities = Object.keys(token.actor.system.abilities || {});
    const updates = {};

    for (const abl of abilities) {
      const select = dialogRoot.querySelector(`select[name="${abl}"]`);
      const base = parseInt(select?.value || "10");
      const current = token.actor.system.abilities?.[abl]?.value ?? 10;
      const final = current > 10 ? base + (current % 10) : base;
      updates[abl] = { value: final };
    }

    await token.actor.update({ "system.abilities": updates });
    ui.notifications.info("Ability scores assigned.");
  };

  const renderContent = async () => {
    const templatePath = "modules/ability-score-generator/templates/assign-abilities.hbs";
    return await foundry.applications.handlebars.renderTemplate(templatePath, {
      mode: currentMode,
      actorName: token?.actor?.name ?? token?.name ?? "Unknown"
    });
  };

  const html = await renderContent();

  foundry.applications.api.Dialog.prompt({
    id: "assign-abilities-dialog",
    title: `Assign Ability Scores — ${token?.actor?.name ?? token?.name ?? "Unknown"}`,
    content: html,
    label: "Confirm",
    callback: () => {},
    buttons: [],
    options: {
      submitOnChange: false,
      closeOnSubmit: false,
      top: preservedPosition?.top,
      left: preservedPosition?.left
    },
    render: async () => {
      dialogRoot = document.querySelector("#assign-abilities-dialog");
      if (!dialogRoot) return;

      wireModeSelector(dialogRoot);

      const tableDiv = dialogRoot.querySelector("#score-table");
      if (tableDiv) {
        const options =
          currentMode === "roll" ? rolled :
          currentMode === "standard" ? [15, 14, 13, 12, 10, 8] :
          currentMode === "pointbuy" ? pointBuyScores :
          [];

        tableDiv.innerHTML = buildTable(token, options, assigned, currentMode);
        wireDropdowns(tableDiv);
      }

      dialogRoot.querySelector("#roll-btn")?.addEventListener("click", async () => {
        const appEl = dialogRoot.closest(".app");
        const position = appEl
          ? { top: appEl.offsetTop, left: appEl.offsetLeft }
          : undefined;

        const rolls = [];
        for (let i = 0; i < 6; i++) {
          const r = await new Roll("4d6kh3").evaluate();
          rolls.push(r.total);
        }
        rolls.sort((a, b) => a - b);

        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ token }),
          content: `Rolled ability scores (sorted): <strong>${rolls.join(", ")}</strong>`
        });

        rolled = rolls;
        currentMode = "roll";

        const tableDiv = dialogRoot.querySelector("#score-table");
        if (tableDiv) {
          tableDiv.innerHTML = buildTable(token, rolled, assigned, currentMode);
          wireDropdowns(tableDiv);
        }
      });

      dialogRoot.querySelector("#reset-btn")?.addEventListener("click", () => {
        assigned = {};
        const rows = dialogRoot.querySelectorAll("#score-table tbody tr");
        rows.forEach(row => {
          const select = row.querySelector("select");
          const modCell = row.querySelector(".mod-preview");
          const newCell = row.querySelector(".new-score");
          if (select) {
            select.value = "";
            select.dispatchEvent(new Event("change"));
          }
          if (modCell) modCell.innerText = "";
          if (newCell) newCell.innerText = "";
        });
      });

      dialogRoot.querySelector("#apply-btn")?.addEventListener("click", async () => {
        const abilities = Object.keys(token.actor.system.abilities || {});
        let allAssigned = true;
        let totalCost = 0;

        for (const abl of abilities) {
          const select = dialogRoot.querySelector(`select[name="${abl}"]`);
          const base = parseInt(select?.value || "");
          if (isNaN(base)) {
            allAssigned = false;
            break;
          }
          if (currentMode === "pointbuy") {
            totalCost += pointBuyCost(base);
          }
        }

        if (!allAssigned) {
          ui.notifications.warn("Please assign a score to every ability before applying.");
          return;
        }

        if (currentMode === "pointbuy" && totalCost < 27) {
          return foundry.applications.api.Dialog.confirm({
            title: "Unspent Points",
            content: `<p>You have <strong>${27 - totalCost}</strong> unspent point-buy points. Are you sure you want to apply?</p>`,
            confirm: applyScores,
            cancel: () => {},
            options: {
              width: 400,
              classes: ["assign-abilities-confirm"]
            }
          });
        }

        await applyScores();
      });
    }
  });

  const wireModeSelector = (root) => {
    const modeSelect = root.querySelector("#mode-select");
    if (!modeSelect) return;

    modeSelect.addEventListener("change", () => {
      currentMode = modeSelect.value;

      const tableDiv = root.querySelector("#score-table");
      if (!tableDiv) return;

      const options =
        currentMode === "roll" ? rolled :
        currentMode === "standard" ? [15, 14, 13, 12, 10, 8] :
        currentMode === "pointbuy" ? pointBuyScores :
        [];

      tableDiv.innerHTML = buildTable(token, options, assigned, currentMode);
      wireDropdowns(tableDiv);
    });
  };

  const wireDropdowns = (tableDiv) => {
    const abilities = Object.keys(token.actor.system.abilities || {});
    const selects = abilities.map(abl => tableDiv.querySelector(`select[name="${abl}"]`));
    const modCells = abilities.map((_, i) => selects[i]?.closest("tr")?.querySelector(".mod-preview"));
    const newScoreCells = abilities.map((_, i) => selects[i]?.closest("tr")?.querySelector(".new-score"));

    const getAssigned = () => {
      assigned = {};
      selects.forEach((s, i) => {
        const val = parseInt(s?.value);
        if (!isNaN(val)) assigned[abilities[i]] = val;
      });
      return assigned;
    };

    const updateDropdowns = () => {
      const assignedMap = getAssigned();
      const assignedScores = Object.values(assignedMap);
      const remaining = currentMode === "pointbuy"
        ? 27 - assignedScores.reduce((sum, val) => sum + pointBuyCost(val), 0)
        : null;

      const headerCell = tableDiv.querySelector("thead th:nth-child(3)");
      if (headerCell && currentMode === "pointbuy") {
        headerCell.textContent = `Assign (${remaining})`;
      }

      selects.forEach((select, i) => {
        const currentScore = token.actor.system.abilities?.[abilities[i]]?.value ?? 10;
        const base = parseInt(select.value);
        let pool = [];

        if (currentMode === "pointbuy") {
          pool = pointBuyScores.slice();
        } else {
          const used = selects
            .map((s, idx) => idx !== i ? parseInt(s?.value) : NaN)
            .filter(v => !isNaN(v));

          pool = [...(currentMode === "standard" ? [15, 14, 13, 12, 10, 8] : rolled)];
          used.forEach(val => {
            const index = pool.indexOf(val);
            if (index !== -1) pool.splice(index, 1);
          });

          if (!isNaN(base)) pool.push(base);
        }

        pool.sort((a, b) => a - b);

        select.innerHTML = `<option value=""></option>` + pool.map(score => {
          const cost = pointBuyCost(score);
          const selected = score === base ? "selected" : "";
          const label = currentMode === "pointbuy" ? `${score} (${cost})` : `${score}`;
          const disabled = currentMode === "pointbuy" && cost > remaining && score !== base ? "disabled" : "";
          return `<option value="${score}" ${selected} ${disabled}>${label}</option>`;
        }).join("");

        const newScore = !isNaN(base) && currentScore > 10
          ? base + (currentScore % 10)
          : base;

        newScoreCells[i].innerText = isNaN(newScore) ? "" : newScore;
                modCells[i].innerText = isNaN(newScore) ? "" : modifier(newScore);
      });
    };

    selects.forEach(select => {
      select.addEventListener("change", () => {
        updateDropdowns();
      });
    });

    updateDropdowns();
  };
};