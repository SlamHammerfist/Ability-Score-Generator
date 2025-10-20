export const costTable = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

export const MAX_POINTS = 27;

export function getModifier(score) {
  return isNaN(score) ? "" : Math.floor((score - 10) / 2);
}

export function getPointCost(score) {
  return costTable[score] ?? "?";
}

export function getRemainingPoints(scores) {
  return MAX_POINTS - scores.reduce((sum, val) => sum + (costTable[val] ?? 100), 0);
}

export function getTotalCost(scores) {
  return scores.reduce((sum, val) => sum + (costTable[val] ?? 100), 0);
}

export function isValidScore(score) {
  return typeof score === "number" && score >= 8 && score <= 15;
}

export async function rollScores(actor) {
  const rolledScores = [];
  const rollObjects = [];

  for (let i = 0; i < 6; i++) {
    const roll = new Roll("4d6kh3");
    await roll.evaluate();
    rolledScores.push(roll.total);
    rollObjects.push(roll);
  }

  const rollList = rolledScores
    .map((score, i) => `<li>Score ${i + 1}: <strong>${score}</strong></li>`)
    .join("");

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>Rolled Ability Scores:</strong></p><ul>${rollList}</ul>`,
    rolls: rollObjects,
    flags: { "dice-so-nice": { showRoll: true } }
  });

  return rolledScores;
}

export async function applyScores(actor, abilities, html, mode, rolledScores) {
  const formEl = html.find("form")[0];
  if (!formEl) return;

  const scores = [];
  const missing = [];

  for (const ability of abilities) {
    const val = formEl.querySelector(`[name="${ability}"]`)?.value;
    const num = Number(val);
    if (!val || isNaN(num)) {
      missing.push(CONFIG.DND5E.abilities[ability]?.label ?? ability);
      scores.push(undefined);
    } else {
      scores.push(num);
    }
  }

  if (missing.length) {
    ui.notifications.error(`Missing scores for: ${missing.join(", ")}`);
    return false;
  }

  if (mode === "roll") {
    const assigned = scores.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const rolled = rolledScores.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    for (const [score, count] of Object.entries(assigned)) {
      if (count > (rolled[score] || 0)) {
        ui.notifications.error(`Score ${score} used too many times.`);
        return false;
      }
    }
  }

  if (mode === "buy") {
    const totalCost = getTotalCost(scores);
    if (totalCost > MAX_POINTS) {
      ui.notifications.error(`Total cost exceeds ${MAX_POINTS} points. You’ve spent ${totalCost}.`);
      return false;
    }

    if (totalCost < MAX_POINTS) {
      const remaining = MAX_POINTS - totalCost;
      return Dialog.confirm({
        title: "Unspent Points",
        content: `<p>You still have <strong>${remaining}</strong> unspent point${remaining === 1 ? "" : "s"}. Are you sure you want to apply?</p>`,
        yes: async () => {
          await actor.update(buildUpdates(abilities, scores));
          ui.notifications.info("Ability scores updated.");
        },
        no: () => {},
        defaultYes: false
      });
    }
  }

  await actor.update(buildUpdates(abilities, scores));
  ui.notifications.info("Ability scores updated.");
  return true;
}

function buildUpdates(abilities, scores) {
  return abilities.reduce((acc, ability, i) => {
    acc[`system.abilities.${ability}.value`] = scores[i];
    return acc;
  }, {});
}