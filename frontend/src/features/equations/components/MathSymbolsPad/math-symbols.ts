export type MathSymbol = { label: string; insert: string };

const ALL_MATH_SYMBOLS: MathSymbol[] = [
  { label: '√', insert: 'sqrt()' },
  { label: '³√', insert: 'cbrt()' },
  { label: '|x|', insert: '||' },
  { label: '^', insert: '^' },
  { label: '/', insert: '/' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '*', insert: '*' },
  { label: '=', insert: '=' },
];

export const CREATE_EQUATION_MATH_SYMBOLS = ALL_MATH_SYMBOLS.filter(
  (symbol) => symbol.insert !== '||'
);

export const RESOLUTION_MATH_SYMBOLS = ALL_MATH_SYMBOLS.filter(
  (symbol) => symbol.insert !== '='
);
