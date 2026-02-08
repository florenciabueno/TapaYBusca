import { EquationsLayout } from '../components/EquationsLayout';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <EquationsLayout>
      <div className="max-w-6xl">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: '#0C2C55' }}
        >
          {title}
        </h1>
        <p style={{ color: '#296374' }}>
          Próximamente...
        </p>
      </div>
    </EquationsLayout>
  );
};
