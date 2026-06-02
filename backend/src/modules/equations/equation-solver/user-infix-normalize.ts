function normalizeDecimalCommas(s: string): string {
  return s.replace(/(\d+),(\d+)/g, '$1.$2');
}

function insertImplicitMultiplication(s: string): string {
  let out = s.replace(/X/g, 'x');
  out = out.replace(/(?<![a-zA-Z_])(\d)([x(])/g, '$1*$2');
  out = out.replace(/(\))([x\d(])/g, '$1*$2');
  out = out.replace(/(x)(\()/g, '$1*$2');
  return out;
}

export function normalizeUserInfix(equation: string): string {
  const stripped = (equation ?? '').replace(/\s/g, '');
  return insertImplicitMultiplication(normalizeDecimalCommas(stripped));
}
