import { costTable, getModifier, getPointCost, getRemainingPoints } from "./score-handler.js";

export function renderAssignmentTable(wrapper, abilities, source, mode) {
  wrapper.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("ability-gen-table");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Ability</th>
        <th id="score-header">Score</th>
        <th>Modifier</th>
      </tr>
    </thead>
    <tbody>
      ${abilities.map(ability => {
        const label = CONFIG.DND5E.abilities[ability]?.label ?? ability.toUpperCase();
        const options = buildScoreOptions(source, mode);

        return `
          <tr>
            <td class="ability-label">${label}</td>
            <td class="score-cell">
              <select name="${ability}" aria-label="Assign score to ${label}">
                ${options}
              </select>
            </td>
            <td class="mod-preview"></td>
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

export function wireScoreListeners(html, modeSelector, rolledScores) {
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
        const rolled = rolledScores.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});

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
      const val = select.value;
      const preview = select.closest("tr")?.querySelector(".mod-preview");
      if (preview) {
        const mod = val === "" ? "" : getModifier(Number(val));
        preview.textContent = mod === "" ? "" : (mod >= 0 ? `+${mod}` : `${mod}`);
      }
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