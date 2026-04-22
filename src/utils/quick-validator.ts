export const quickValidate = (input: string): boolean => {
    return input && input.trim().length > 0;
};

export const isEmpty = (str: string): boolean => {
    return !str || str.trim() === '';
};