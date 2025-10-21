export const modifier = (score) => {
  return Math.floor((score - 10) / 2);
};

export const pointBuyScores = [8, 9, 10, 11, 12, 13, 14, 15];

export const pointBuyCost = (score) => {
  if (score < 8 || score > 15) return Infinity;
  return [0, 1, 2, 3, 4, 5, 7, 9][score - 8];
};
