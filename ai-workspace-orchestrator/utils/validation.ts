export function validateInput(input: string, maxLength: number = 1000): boolean {
  return input && input.trim().length > 0 && input.length <= maxLength;
}