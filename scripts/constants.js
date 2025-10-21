export const abilities = ["str", "dex", "con", "int", "wis", "cha"];

export const getLabels = () => {
  return Object.fromEntries(
    Object.entries(CONFIG.DND5E.abilities).map(([k, v]) => [k, v.label])
  );
};

export const standard = [8, 10, 12, 13, 14, 15];
export const pointBuy = [8, 9, 10, 11, 12, 13, 14, 15];
export const pointBuyCost = {
  8: 0, 9: 1, 10: 2, 11: 3,
  12: 4, 13: 5, 14: 7, 15: 9
};
export const maxBudget = 27;