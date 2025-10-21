import { modifier, pointBuyCost, pointBuyScores, STANDARD_ARRAY } from "./utils.js";

// Build the ability score assignment table
export const buildTable = (source, options = [], assigned = {}, mode = "roll", getCurrentScore) => {
  const actor = source?.actor ?? source;
  const abilities = Object.keys(actor.system.abilities);
  const fallbackLabels = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
  };

  const labels = abilities.map(abl => {
    const label = actor.system.abilities?.[abl]?.label;
    return label || fallbackLabels[abl] || abl.charAt(0).toUpperCase() + abl.slice(1);
  });

  const remaining = mode === "pointbuy"
    ? 27 - Object.values(assigned).reduce((sum, val) => sum + pointBuyCost(val), 0)
    : null;

  const scoreHeader = remaining !== null ? `Assign (${remaining})` : "Assign";

  let html = `<table class="assign-table">
    <thead>
      <tr>
        <th class="ability-header">Ability</th>
        <th class="current-header">Current</th>
        <th class="assign-header">${scoreHeader}</th>
        <th class="new-header">New</th>
        <th class="mod-header">Modifier</th>
      </tr>
    </thead>
    <tbody>`;

  for (let i = 0; i < abilities.length; i++) {
    const abl = abilities[i];
    const label = labels[i];
    const current = typeof getCurrentScore === "function"
      ? getCurrentScore(abl)
      : actor.system.abilities?.[abl]?.value ?? 10;
    const selected = assigned[abl];
    const newScore = Number.isInteger(selected)
      ? selected + (current > 10 ? current - 10 : 0)
      : selected;
    const mod = Number.isInteger(newScore) ? modifier(newScore) : "";

    html += `<tr>
      <td class="ability-cell">${label}</td>
      <td class="current-score">${current}</td>
      <td class="assign-cell">
        <select name="${abl}">
          <option value=""></option>
          ${options.map(score => {
            const label = mode === "pointbuy"
              ? `${score} (${pointBuyCost(score)})`
              : `${score}`;
            const selectedAttr = selected === score ? "selected" : "";
            return `<option value="${score}" ${selectedAttr}>${label}</option>`;
          }).join("")}
        </select>
      </td>
      <td class="new-score">${Number.isInteger(newScore) ? newScore : ""}</td>
      <td class="mod-preview">${mod}</td>
    </tr>`;
  }

  html += `</tbody></table>`;
  return html;
};

// Wire dropdowns and update scores/modifiers
export function wireDropdowns(tableDiv, source, assigned, mode, updateAssigned, rolled = [], getCurrentScore) {
  const actor = source?.actor ?? source;
  const abilities = Object.keys(actor.system.abilities || {});
  const selects = abilities.map(abl => tableDiv.querySelector(`select[name="${abl}"]`));
  const modCells = abilities.map((_, i) => selects[i]?.closest("tr")?.querySelector(".mod-preview"));
  const newScoreCells = abilities.map((_, i) => selects[i]?.closest("tr")?.querySelector(".new-score"));
  const currentScoreCells = abilities.map((_, i) => selects[i]?.closest("tr")?.querySelector(".current-score"));

  const getAssigned = () => {
    assigned = {};
    selects.forEach((s, i) => {
      const val = parseInt(s?.value);
      if (!isNaN(val)) assigned[abilities[i]] = val;
    });
    updateAssigned(assigned);
    return assigned;
  };

  const updateDropdowns = () => {
    const assignedMap = getAssigned();
    const assignedScores = Object.values(assignedMap);
    const remaining = mode === "pointbuy"
      ? 27 - assignedScores.reduce((sum, val) => sum + pointBuyCost(val), 0)
      : null;

    const headerCell = tableDiv.querySelector("thead th.assign-header");
    if (headerCell && mode === "pointbuy") {
      headerCell.textContent = `Assign (${remaining})`;
    }

    const options = mode === "roll" ? rolled :
      mode === "standard" ? STANDARD_ARRAY :
      mode === "pointbuy" ? pointBuyScores : [];

    selects.forEach((select, i) => {
      const abl = abilities[i];
      const currentScore = typeof getCurrentScore === "function"
        ? getCurrentScore(abl)
        : actor.system.abilities?.[abl]?.value ?? 10;

      const base = parseInt(select.value);
      let pool = [];

      if (mode === "pointbuy") {
        pool = pointBuyScores.slice();
      } else {
        const used = selects
          .map((s, idx) => idx !== i ? parseInt(s?.value) : NaN)
          .filter(v => !isNaN(v));

        pool = options.slice();
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
        const label = mode === "pointbuy" ? `${score} (${cost})` : `${score}`;
        const disabled = mode === "pointbuy" && cost > remaining && score !== base ? "disabled" : "";
        return `<option value="${score}" ${selected} ${disabled}>${label}</option>`;
      }).join("");

      const newScore = !isNaN(base) && currentScore > 10
        ? base + (currentScore - 10)
        : base;

      currentScoreCells[i].innerText = currentScore;
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
}

// Wire mode selector and rebuild table
export function wireModeSelector(root, source, rolled, assigned, modeRef, updateAssigned) {
  const actor = source?.actor ?? source;
  const modeSelect = root.querySelector("#mode-select");
  if (!modeSelect) return;

  modeSelect.addEventListener("change", () => {
    modeRef.value = modeSelect.value;

    const tableDiv = root.querySelector("#score-table");
    if (!tableDiv) return;

    const getCurrentScore = abl => actor.system.abilities?.[abl]?.value ?? 10;
    const options =
      modeRef.value === "roll" ? rolled :
      modeRef.value === "standard" ? STANDARD_ARRAY :
      modeRef.value === "pointbuy" ? pointBuyScores : [];

    tableDiv.innerHTML = buildTable(actor, options, assigned, modeRef.value, getCurrentScore);
    wireDropdowns(tableDiv, actor, assigned, modeRef.value, updateAssigned, rolled, getCurrentScore);

    const rollBtn = root.querySelector("#roll-btn");
    const buttonRow = root.querySelector("#assign-buttons");

    if (rollBtn) {
      const isRoll = modeRef.value === "roll";
      rollBtn.classList.toggle("hidden", !isRoll);
      buttonRow.classList.toggle("wide", !isRoll);
    }
  });
}