import { Link } from 'react-router-dom';
import { COLORS } from '../../../../config/theme';

export interface AuthFooterProps {
  text?: string;
  linkTo: string;
  linkLabel: string;
  variant: 'inline' | 'button';
  linkColor?: string;
}

export const AuthFooter = ({
  text,
  linkTo,
  linkLabel,
  variant,
  linkColor = COLORS.teal,
}: AuthFooterProps) => {
  if (variant === 'button') {
    return (
      <Link
        to={linkTo}
        className="cursor-pointer block w-full py-2.5 text-center border-2 rounded-lg font-semibold transition-colors hover:opacity-90 text-sm"
        style={{
          borderColor: linkColor,
          color: linkColor,
        }}
      >
        {linkLabel}
      </Link>
    );
  }

  return (
    <p className="text-sm text-center" style={{ color: COLORS.gray[600] }}>
      {text}
      <Link
        to={linkTo}
        className="cursor-pointer font-medium hover:underline"
        style={{ color: linkColor }}
      >
        {linkLabel}
      </Link>
    </p>
  );
};
