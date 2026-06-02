export function formatDecimalCommaForDisplay(s: string): string {
  return s.replace(/(\d+)\.(\d+)/g, '$1,$2');
}

/**
 * Formats a numeric solution value as a LaTeX string. Integer-rounded values
 * render as plain integers; values whose square is a non-perfect integer render
 * as a square root; otherwise the value is rendered with at most 6 decimals.
 */
export const formatSolutionValueLatex = (value: number): string => {
  const roundedInt = Math.round(value);
  if (Math.abs(value - roundedInt) <= 1e-9) return String(roundedInt);

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const square = abs * abs;
  const roundedSquare = Math.round(square);
  const isPerfectSquare = Number.isInteger(Math.sqrt(roundedSquare));
  if (
    roundedSquare > 1 &&
    Math.abs(square - roundedSquare) <= 1e-8 &&
    !isPerfectSquare
  ) {
    return `${sign}\\sqrt{${roundedSquare}}`;
  }

  return formatDecimalCommaForDisplay(String(Number(value.toFixed(6))));
};

/**
 * Renders the LaTeX expression "S = \{ v1, v2, ... \}" for a set of solutions,
 * or "S = {}" when the list is empty.
 */
export const formatSolutionSetLatex = (solutionSet: number[]): string => {
  if (solutionSet.length === 0) return 'S = \\{\\}';
  return `S = \\{ ${solutionSet.map(formatSolutionValueLatex).join(', ')} \\}`;
};

export const formatSolutionSetLatexFromItems = (items: string[]): string => {
  if (items.length === 0) return 'S = \\{\\}';
  return `S = \\{ ${items.join(', ')} \\}`;
};

export const formatSolutionSetExpression = (
  numeric: number[],
  latexItems?: string[]
): string => {
  if (latexItems && latexItems.length > 0) {
    return formatSolutionSetLatexFromItems(latexItems);
  }
  return formatSolutionSetLatex(numeric);
};
