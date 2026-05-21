export function infixToLatex(expression: string): string {
  const s = expression.trim();
  if (!s) return s;
  if (s.includes('\\')) return s;
  const eqIndex = s.indexOf('=');
  if (eqIndex === -1) return convertInfixPart(s);
  const left = s.slice(0, eqIndex).trim();
  const right = s.slice(eqIndex + 1).trim();
  return `${convertInfixPart(left)}=${convertInfixPart(right)}`;
}

export function resultToLatex(result: string): string {
  const s = (result ?? '').trim();
  if (!s) return s;
  if (s === '{}') return '\\emptyset';
  const negMatch = s.match(/^neg\((.+)\)$/i);
  if (negMatch) {
    const inner = negMatch[1] ?? '';
    return `-${infixToLatex(inner)}`;
  }
  const simpleFrac = s.match(/^(-?\d+)\/(\d+)$/);
  if (simpleFrac) {
    const [, num, den] = simpleFrac;
    const isNegative = num!.startsWith('-');
    const absNum = isNegative ? num!.slice(1) : num!;
    return `${isNegative ? '-' : ''}\\frac{${absNum}}{${den}}`;
  }
  try {
    return infixToLatex(s);
  } catch {
    return s;
  }
}

function convertInfixPart(expr: string): string {
  let out = expr;
  let changed = true;
  while (changed) {
    changed = false;

    const cbrtMatch = out.match(/\bcbrt\s*\(/i);
    if (cbrtMatch && cbrtMatch.index !== undefined) {
      const inner = takeBalancedParen(out, cbrtMatch.index + cbrtMatch[0].length - 1);
      if (inner !== null) {
        const arg = convertInfixPart(inner);
        out =
          out.slice(0, cbrtMatch.index) +
          `\\sqrt[3]{${arg}}` +
          out.slice(cbrtMatch.index + cbrtMatch[0].length + inner.length + 1);
        changed = true;
        continue;
      }
    }

    const sqrtMatch = out.match(/\bsqrt\s*\(/i);
    if (sqrtMatch && sqrtMatch.index !== undefined) {
      const openParen = sqrtMatch.index + sqrtMatch[0].length - 1;
      const inner = takeBalancedParen(out, openParen);
      if (inner !== null) {
        const arg = convertInfixPart(inner);
        out =
          out.slice(0, sqrtMatch.index) +
          `\\sqrt{${arg}}` +
          out.slice(openParen + 1 + inner.length + 1);
        changed = true;
        continue;
      }
    }

    const pot2Match = out.match(/\bpot2\s*\(/i);
    if (pot2Match && pot2Match.index !== undefined) {
      const openParen = pot2Match.index + pot2Match[0].length - 1;
      const inner = takeBalancedParen(out, openParen);
      if (inner !== null) {
        const arg = convertInfixPart(inner);
        out =
          out.slice(0, pot2Match.index) +
          `{${arg}}^2` +
          out.slice(openParen + 1 + inner.length + 1);
        changed = true;
        continue;
      }
    }

    const pot3Match = out.match(/\bpot3\s*\(/i);
    if (pot3Match && pot3Match.index !== undefined) {
      const openParen = pot3Match.index + pot3Match[0].length - 1;
      const inner = takeBalancedParen(out, openParen);
      if (inner !== null) {
        const arg = convertInfixPart(inner);
        out =
          out.slice(0, pot3Match.index) +
          `{${arg}}^3` +
          out.slice(openParen + 1 + inner.length + 1);
        changed = true;
        continue;
      }
    }

    const doubleOpen = out.indexOf('((');
    if (doubleOpen !== -1) {
      const slashParen = out.indexOf(')/(', doubleOpen);
      if (slashParen !== -1) {
        const numInner = out.slice(doubleOpen + 2, slashParen).trim();
        const denOpenIndex = slashParen + 2;
        const denInner = takeBalancedParen(out, denOpenIndex);
        if (denInner !== null) {
          const numLatex = convertInfixPart(numInner);
          const denLatex = convertInfixPart(denInner);
          const endIdx = denOpenIndex + 1 + denInner.length + 1 + 1;
          out =
            out.slice(0, doubleOpen) +
            `\\frac{${numLatex}}{${denLatex}}` +
            out.slice(endIdx);
          changed = true;
          continue;
        }
      }
    }

  }

  return out;
}

function takeBalancedParen(str: string, openIndex: number): string | null {
  if (str[openIndex] !== '(') return null;
  let depth = 1;
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return str.slice(openIndex + 1, i);
    }
  }
  return null;
}
