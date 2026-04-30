export const validateNumberRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const validatePercentage = (value: number): boolean => {
  return validateNumberRange(value, 0, 100);
};