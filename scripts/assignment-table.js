export function renderAssignmentTable(wrapper, abilities, sourceScores, mode) {
  if (!wrapper) return;

  const costTable = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const maxPoints = 27;

  const currentSelections = {};
  for (const select of wrapper.querySelectorAll("select")) {
    const val = select.value;
    if (val) currentSelections[select.name] = Number(val);
  }

  let currentCost = 0;
  for (const val of Object.values(currentSelections)) {
    currentCost += costTable[val] ?? 100;
  }

  const scoreCounts = {};
  for (const score of sourceScores) {
    scoreCounts[score] = (scoreCounts[score] || 0) + 1;
  }

  const usedCounts = {};
  for (const val of Object.values(currentSelections)) {
    usedCounts[val] = (usedCounts[val] || 0) + 1;
  }

  // Scores to render
  const scoresToRender = mode === "buy"
    ? Array.from({ length: 8 }, (_, i) => i + 8)
    : sourceScores.slice().sort((a, b) => a - b);

  wrapper.innerHTML = "";

  const table = document.createElement("table");
  table.style.width = "100%";

  const header = document.createElement("tr");
  let scoreHeader = "Score";
  if (mode === "buy") {
    const remaining = Math.max(0, maxPoints - currentCost);
    scoreHeader += ` <span style="color: #888; font-weight: normal;">(${remaining})</span>`;
  }

  header.innerHTML = `
    <th style="text-align: left;">Ability</th>
    <th style="text-align: left;">${scoreHeader}</th>
    <th style="text-align: left;">Modifier</th>
  `;
  table.appendChild(header);

  for (const ability of abilities) {
    const row = document.createElement("tr");

    const selected = currentSelections[ability];
    const labelText = CONFIG.DND5E.abilities[ability].label;

    const labelCell = document.createElement("td");
    labelCell.innerHTML = `<label for="${ability}" title="${CONFIG.DND5E.abilities[ability].abbreviation}">${labelText}</label>`;

    const selectCell = document.createElement("td");
    const select = document.createElement("select");
    select.name = ability;
    select.id = ability;
    select.style.width = "5em";

    select.innerHTML = `<option value="">—</option>`;

    const scorePool = scoresToRender.slice();
    if (selected !== undefined && !scorePool.includes(selected)) {
      scorePool.unshift(selected);
    }

    const scoreUsage = {};
    for (const score of scorePool) {
      scoreUsage[score] = (scoreUsage[score] || 0) + 1;
    }

    for (const val of Object.values(currentSelections)) {
      scoreUsage[val] = Math.max(0, (scoreUsage[val] || 0) - 1);
    }

    for (const score of scorePool) {
      if (scoreUsage[score] <= 0 && score !== selected && mode !== "buy") continue;

      const scoreCost = costTable[score] ?? 0;
      const label = mode === "buy" ? `${score} \u2009(${scoreCost})` : `${score}`;
      const selectedAttr = score === selected ? "selected" : "";
      const disabledAttr = mode === "buy" && scoreCost > (maxPoints - currentCost) ? "disabled" : "";

      select.innerHTML += `<option value="${score}" ${selectedAttr} ${disabledAttr}>${label}</option>`;
      if (mode !== "buy") scoreUsage[score]--;
    }

    const modCell = document.createElement("td");
    modCell.className = "mod-preview";
    modCell.style.paddingLeft = "1em";
    modCell.style.color = "#888";
    modCell.textContent = selected ? formatModifier(selected) : "";

    select.addEventListener("change", () => {
      renderAssignmentTable(wrapper, abilities, sourceScores, mode);
    });

    selectCell.appendChild(select);
    row.appendChild(labelCell);
    row.appendChild(selectCell);
    row.appendChild(modCell);
    table.appendChild(row);
  }

  wrapper.appendChild(table);
}

function formatModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;

}

