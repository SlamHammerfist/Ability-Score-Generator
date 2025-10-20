import { costTable, getModifier, getPointCost, getRemainingPoints } from "./score-handler.js";

export function renderAssignmentTable(wrapper, abilities, source, mode, actor) {
  wrapper.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("ability-gen-table");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Ability</th>
        <th>Current</th>
        <th id="score-header">Score</th>
        <th>Result</th>
        <th>Modifier</th>
      </tr>
    </thead>
    <tbody>
      ${abilities.map(ability => {
        const label = CONFIG.DND5E.abilities[ability]?.label ?? ability.toUpperCase();
        const current = foundry.utils.getProperty(actor.system, `abilities.${ability}.value`) ?? 0;
        const options = buildScoreOptions(source, mode);

        return `
          <tr data-ability="${ability}">
            <td class="ability-label">${label}</td>
            <td class="current-score">${current}</td>
            <td class="score-cell">
              <select name="${ability}" aria-label="Assign score to ${label}">
                ${options}
              </select>
            </td>
            <td class="result-score">—</td>
            <td class="mod-preview">—</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  const form = document.createElement("form");
  form.classList.add("ability-gen-form");
  form.appendChild(table);
  wrapper.appendChild(form);
}

export function wireScoreListeners(html, modeSelector, actor, abilities, rolledScores) {
  const formEl = html.find("form")[0];
  if (!formEl) return;

  const selects = Array.from(formEl.querySelectorAll("select[name]"));

  const getUsedScores = () =>
    selects.map(s => s.value).filter(v => v !== "").map(Number);

  const rebuildOptions = () => {
    const mode = modeSelector.val();
    const header = html.find("#score-header")[0];

    for (const select of selects) {
      const current = Number(select.value) || null;

      const assigned = {};
      for (const other of selects) {
        if (other === select) continue;
        const val = Number(other.value);
        if (!isNaN(val)) {
          assigned[val] = (assigned[val] || 0) + 1;
        }
      }

      let pool = [];

      if (mode === "roll") {
        const rolled = rolledScores?.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {}) ?? {};

        for (const [scoreStr, count] of Object.entries(rolled)) {
          const score = Number(scoreStr);
          const used = assigned[score] || 0;
          const remaining = count - used;
          for (let i = 0; i < remaining; i++) pool.push(score);
        }

        if (current !== null && !pool.includes(current)) pool.push(current);
        pool.sort((a, b) => a - b);
      }

      else if (mode === "array") {
        const arraySource = [15, 14, 13, 12, 10, 8];
        pool = arraySource
          .filter(score => score === current || !Object.keys(assigned).includes(String(score)))
          .sort((a, b) => a - b);
      }

      else if (mode === "buy") {
        pool = Array.from({ length: 8 }, (_, i) => i + 8);
      }

      const remaining = getRemainingPoints(getUsedScores());

      select.innerHTML = `<option value="">—</option>` + pool.map(score => {
        const label = mode === "buy" ? `${score} (${getPointCost(score)})` : `${score}`;
        const disabled = mode === "buy" && score !== current && costTable[score] > remaining;
        return `<option value="${score}"${disabled ? " disabled" : ""}>${label}</option>`;
      }).join("");

      select.value = current ?? "";
    }

    if (mode === "buy" && header) {
      const remaining = getRemainingPoints(getUsedScores());
      header.textContent = `Score (${remaining})`;
    } else if (header) {
      header.textContent = "Score";
    }
  };

  for (const select of selects) {
    select.addEventListener("change", () => {
      const row = select.closest("tr");
      const ability = row?.dataset.ability;
      const assigned = parseInt(select.value);
      const current = foundry.utils.getProperty(actor.system, `abilities.${ability}.value`) ?? 0;

      const result = isNaN(assigned)
        ? current
        : current <= 10 ? assigned : current + (assigned % 10);

      const mod = isNaN(result) ? "—" : getModifier(result);

      const resultCell = row.querySelector(".result-score");
      const modCell = row.querySelector(".mod-preview");

      if (resultCell) resultCell.textContent = result;
      if (modCell) modCell.textContent = mod >= 0 ? `+${mod}` : `${mod}`;

      rebuildOptions();
    });
  }

  rebuildOptions();
}

function buildScoreOptions(source, mode) {
  return [`<option value="">—</option>`].concat(
    source.map(score => {
      const disabled = mode === "buy" && !costTable.hasOwnProperty(score);
      return `<option value="${score}"${disabled ? " disabled" : ""}>${score}</option>`;
    })
  ).join("");
}