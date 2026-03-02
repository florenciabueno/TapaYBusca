import { EquationsLayout } from '../components/EquationsLayout';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <EquationsLayout>
      <div className="max-w-6xl">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        <p className="text-gray-500">
          Próximamente...
        </p>
      </div>
    </EquationsLayout>
  );
};
