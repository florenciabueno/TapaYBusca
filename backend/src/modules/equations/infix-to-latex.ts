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

    const parenFrac = findParenSlashFraction(out);
    if (parenFrac) {
      const numLatex = convertInfixPart(parenFrac.numInner);
      const denLatex = convertInfixPart(parenFrac.denInner);
      out =
        out.slice(0, parenFrac.start) +
        `\\frac{${numLatex}}{${denLatex}}` +
        out.slice(parenFrac.end);
      changed = true;
      continue;
    }

    const numSlashParenFrac = findNumSlashParenFraction(out);
    if (numSlashParenFrac) {
      const numLatex = convertInfixPart(numSlashParenFrac.numInner);
      const denLatex = convertInfixPart(numSlashParenFrac.denInner);
      out =
        out.slice(0, numSlashParenFrac.start) +
        `\\frac{${numLatex}}{${denLatex}}` +
        out.slice(numSlashParenFrac.end);
      changed = true;
      continue;
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

  return replaceSimpleInlineFractions(out);
}

function findParenSlashFraction(
  expr: string
): { start: number; end: number; numInner: string; denInner: string } | null {
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] !== '(') continue;
    const numInner = takeBalancedParen(expr, i);
    if (numInner === null) continue;
    const slashIdx = i + 1 + numInner.length + 1;
    if (expr[slashIdx] !== '/') continue;
    const den = takeFractionDenominator(expr, slashIdx + 1);
    if (!den) continue;
    return {
      start: i,
      end: den.end,
      numInner,
      denInner: den.inner,
    };
  }
  return null;
}

function findNumSlashParenFraction(
  expr: string
): { start: number; end: number; numInner: string; denInner: string } | null {
  for (let i = 0; i < expr.length - 1; i++) {
    if (expr[i] !== '/' || expr[i + 1] !== '(') continue;
    const denOpen = i + 1;
    const denInner = takeBalancedParen(expr, denOpen);
    if (denInner === null) continue;
    const num = takeSimpleFractionNumerator(expr, i);
    if (!num) continue;
    return {
      start: num.start,
      end: denOpen + 1 + denInner.length + 1,
      numInner: num.inner,
      denInner,
    };
  }
  return null;
}

function takeSimpleFractionNumerator(
  expr: string,
  slashIndex: number
): { inner: string; start: number } | null {
  if (slashIndex <= 0) return null;
  const prefix = expr.slice(0, slashIndex);
  if (prefix.endsWith(')')) return null;
  const match = prefix.match(/(-?\d+|[xX])$/);
  if (!match?.[1]) return null;
  const inner = match[1];
  const start = slashIndex - inner.length;
  if (start > 0 && /[a-zA-Z0-9_]/.test(expr[start - 1]!)) return null;
  return { inner, start };
}

function takeFractionDenominator(
  expr: string,
  start: number
): { inner: string; end: number } | null {
  if (start >= expr.length) return null;
  if (expr[start] === '(') {
    const inner = takeBalancedParen(expr, start);
    if (inner === null) return null;
    return { inner, end: start + 1 + inner.length + 1 };
  }
  const tail = expr.slice(start);
  const simple = tail.match(/^(-?\d+|[xX])\b/);
  if (simple) {
    return { inner: simple[1], end: start + simple[1].length };
  }
  return null;
}

function replaceSimpleInlineFractions(expr: string): string {
  return expr.replace(
    /(^|[=+\-*/(])(-?\d+|[xX])\/(\d+|[xX])(?=$|[=+\-*/)])/g,
    (_match, prefix: string, numerator: string, denominator: string) => {
      const isNegative = numerator.startsWith('-');
      const absNumerator = isNegative ? numerator.slice(1) : numerator;
      return `${prefix}${isNegative ? '-' : ''}\\frac{${absNumerator}}{${denominator}}`;
    }
  );
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
