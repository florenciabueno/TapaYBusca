function normalizeDecimalCommas(s: string): string {
  return s.replace(/(\d+),(\d+)/g, '$1.$2');
}

const UNARY_PLUS_AFTER = new Set(['=', '(', '+', '-', '*', '/']);

/** Removes unary + for parsing; raw user input is kept elsewhere for display. */
export function stripUnaryPlus(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === '+' && (i === 0 || UNARY_PLUS_AFTER.has(s[i - 1]!))) continue;
    out += c;
  }
  return out;
}

function insertImplicitMultiplication(s: string): string {
  let out = s;
  out = out.replace(/(?<![a-zA-Z])(\d)([a-zA-Z])(?![a-zA-Z0-9])/g, '$1*$2');
  out = out.replace(/(?<![a-zA-Z])(\d)(\()/g, '$1*$2');
  out = out.replace(/(\))([a-zA-Z])(?![a-zA-Z0-9])/g, '$1*$2');
  out = out.replace(/(?<![a-zA-Z])([a-zA-Z])(\()/g, '$1*$2');
  return out;
}

export function normalizeUserInfix(equation: string): string {
  const stripped = (equation ?? '').replace(/\s/g, '');
  return insertImplicitMultiplication(normalizeDecimalCommas(stripped));
}

/** Converts pipe notation |expr| into abs(expr) for parsing. */
export function convertPipeAbsToAbsCall(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '|') {
      out += s[i];
      continue;
    }
    let j = i + 1;
    while (j < s.length && s[j] !== '|') j++;
    if (j >= s.length) {
      out += s[i];
      continue;
    }
    out += `abs(${s.slice(i + 1, j)})`;
    i = j;
  }
  return out;
}
