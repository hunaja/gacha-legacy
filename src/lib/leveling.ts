export const calculateEnemyStat = (
  baseStat: number,
  level: number,
  growthRate = 0.05,
): number => {
  if (level <= 1) return Math.floor(baseStat);
  const factor = Math.pow(1 + growthRate, level - 1);
  return Math.floor(baseStat * factor);
};

export const calculateAllyStat = (
  baseStat: number,
  level: number,
  ascension: number,
  growthRate = 0.05,
): number => {
  if (level <= 1) return Math.floor(baseStat);
  const factor = Math.pow(1 + growthRate, level - 1);
  return Math.floor(baseStat * factor);
};

export const xpToNext = (level: number) => {
  return Math.floor(100 * Math.pow(level, 2.1) + 50 * level);
};
