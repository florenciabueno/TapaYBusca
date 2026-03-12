import { EquationsLayout } from '../components/EquationsLayout';
import { COLORS } from '../../../config/theme';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <EquationsLayout>
      <div className="max-w-6xl">
        <h1
          className="mb-2 text-2xl font-semibold"
          style={{ color: COLORS.accentSecondary }}
        >
          {title}
        </h1>
        <p style={{ color: COLORS.gray[600] }}>
          Próximamente...
        </p>
      </div>
    </EquationsLayout>
  );
};
