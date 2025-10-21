import { modifier, pointBuyCost } from "./utils.js";

export const buildTable = (token, options = [], assigned = {}, mode = "roll") => {
  const abilities = Object.keys(token.actor.system.abilities);
  const fallbackLabels = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
  };

  const labels = abilities.map(abl => {
    const label = token.actor.system.abilities?.[abl]?.label;
    return label || fallbackLabels[abl] || abl.charAt(0).toUpperCase() + abl.slice(1);
  });

  const remaining = mode === "pointbuy"
    ? 27 - Object.values(assigned).reduce((sum, val) => sum + pointBuyCost(val), 0)
    : null;

  const scoreHeader = remaining !== null
    ? `Assign (${remaining})`
    : "Assign";

  let html = `<table class="assign-table"><thead>
    <tr>
      <th>Ability</th>
      <th>Current</th>
      <th style="width: 7em;">${scoreHeader}</th>
      <th>New</th>
      <th style="width: 6em;">Modifier</th>
    </tr>
  </thead><tbody>`;

  for (let i = 0; i < abilities.length; i++) {
    const abl = abilities[i];
    const label = labels[i];
    const current = token.actor.system.abilities?.[abl]?.value ?? 10;
    const selected = assigned[abl];
    const newScore = Number.isInteger(selected) && current > 10
      ? selected + (current % 10)
      : selected;

    const mod = Number.isInteger(newScore) ? modifier(newScore) : "";

    html += `<tr>
      <td class="ability-label">${label}</td>
      <td class="current-score">${current}</td>
      <td>
        <select name="${abl}" style="width: 100%;">
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
      <td class="mod-preview" style="text-align: center;">${mod}</td>
    </tr>`;
  }

  html += `</tbody></table>`;
  return html;
};