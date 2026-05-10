import { InlineMath } from 'react-katex';
import { KATEX_OPTIONS } from '../../../../config/katex';

interface MathExpressionProps {
  expression: string;
  className?: string;
}

export const MathExpression = ({
  expression,
  className = '',
}: MathExpressionProps) => {
  return (
    <span className={className} translate="no">
      <InlineMath math={expression} {...KATEX_OPTIONS} />
    </span>
  );
};
