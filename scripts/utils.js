// --- Modifier calculation ---
export const modifier = (score) => {
  const mod = Math.floor((score - 10) / 2);
  return mod > 0 ? `+${mod}` : `${mod}`;
};

// --- Point Buy configuration ---
export const pointBuyScores = [8, 9, 10, 11, 12, 13, 14, 15];

export const pointBuyCost = (score) => {
  if (score < 8 || score > 15) return Infinity;
  return [0, 1, 2, 3, 4, 5, 7, 9][score - 8];
};

// --- Standard Array ---
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// --- Roll 4d6kh3 six times and return sorted array with DSN animation ---
export async function rollAbilityScores(actor) {
  const rolledScores = [];
  const rollObjects = [];

  for (let i = 0; i < 6; i++) {
    const roll = new Roll("4d6kh3");
    await roll.evaluate();
    rolledScores.push(roll.total);
    rollObjects.push(roll);
  }

  const scoreLine = rolledScores.join(", ");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>Rolled Ability Scores:</strong> ${scoreLine}</p>`,
    rolls: rollObjects,
    flags: { "dice-so-nice": { showRoll: true } }
  });

  return rolledScores;
}

// --- Assign scores to actor ---
export const assignScores = async (source, dialogRoot, mode) => {
  const actor = source?.actor ?? source;
  if (!actor?.system?.abilities) return "invalid";

  const abilities = Object.keys(actor.system.abilities || {});
  const updates = {};
  let allAssigned = true;
  let totalCost = 0;

  for (const abl of abilities) {
    const select = dialogRoot.querySelector(`select[name="${abl}"]`);
    const base = parseInt(select?.value || "");
    if (isNaN(base)) {
      allAssigned = false;
      break;
    }
    if (mode === "pointbuy") {
      totalCost += pointBuyCost(base);
    }

    const current = actor.system.abilities?.[abl]?.value ?? 10;
    const backgroundBonus = current > 10 ? current - 10 : 0;
    const final = base + backgroundBonus;
    updates[abl] = { value: final };
  }

  if (!allAssigned) return "incomplete";

  if (mode === "pointbuy" && totalCost < 27) {
    const confirmed = await foundry.applications.api.Dialog.confirm({
      title: "Unspent Points",
      content: `<p>You have <strong>${27 - totalCost}</strong> unspent point-buy points. Are you sure you want to assign?</p>`,
      options: {
        width: 400,
        classes: ["assign-abilities-confirm"]
      }
    });

    if (!confirmed) return "cancelled";
  }

  await actor.update({ "system.abilities": updates });
  ui.notifications.info("Ability scores assigned.");
  return "applied";
};