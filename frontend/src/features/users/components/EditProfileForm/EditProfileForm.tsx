import { useEditProfileForm } from '../../hooks/useEditProfileForm';
import { COLORS } from '../../../../config/theme';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { Input } from '../../../../shared/components/ui/Input/Input';

interface EditProfileFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditProfileForm = ({ onSuccess, onCancel }: EditProfileFormProps) => {
  const {
    user,
    formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit: submitForm,
  } = useEditProfileForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(onSuccess);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="email" label="Email" value={user?.email ?? ''} disabled />

      <Input
        type="text"
        id="name"
        name="name"
        label="Nombre *"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Tu nombre"
      />

      <Input
        type="password"
        id="currentPassword"
        name="currentPassword"
        label="Contraseña actual"
        value={formData.currentPassword}
        onChange={handleChange}
        placeholder="Ingresa tu contraseña actual"
        helperText="Solo si deseas cambiar la contraseña"
      />

      {formData.currentPassword && (
        <>
          <Input
            type="password"
            id="password"
            name="password"
            label="Nueva contraseña *"
            value={formData.password}
            onChange={handleChange}
            required={!!formData.currentPassword}
            placeholder="Mínimo 8 caracteres"
          />

          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar nueva contraseña *"
            value={formData.confirmPassword}
            onChange={handleChange}
            required={!!formData.currentPassword}
            placeholder="Repite la nueva contraseña"
          />
        </>
      )}

      {success && (
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.success.bg, color: COLORS.success.text }}
        >
          ✓ Datos actualizados exitosamente
        </div>
      )}

      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: COLORS.error.bg, color: COLORS.error.text }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" onClick={onCancel} disabled={loading} variant="light">
          Cancelar
        </Button>
        <Button type="submit" disabled={success} variant="accent" isLoading={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
};
