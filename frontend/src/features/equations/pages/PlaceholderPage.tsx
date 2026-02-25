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
          className="text-2xl font-bold mb-2"
          style={{ color: COLORS.primary }}
        >
          {title}
        </h1>
        <p style={{ color: COLORS.secondary }}>
          Próximamente...
        </p>
      </div>
    </EquationsLayout>
  );
};
