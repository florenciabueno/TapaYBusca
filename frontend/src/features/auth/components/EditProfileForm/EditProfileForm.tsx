import { useEditProfileForm } from '../../hooks/useEditProfileForm';
import { COLORS } from '../../../../config/theme';

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
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
          Email
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          style={{ borderColor: COLORS.light }}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
          Nombre *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2C55]"
          style={{ borderColor: COLORS.accent }}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
          Contraseña actual
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ borderColor: COLORS.accent }}
          placeholder="Ingresa tu contraseña actual"
        />
        <p className="text-xs mt-1" style={{ color: COLORS.accent }}>
          Solo si deseas cambiar la contraseña
        </p>
      </div>

      {formData.currentPassword && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
            Nueva contraseña *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!!formData.currentPassword}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.accent }}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      )}

      {formData.currentPassword && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
            Confirmar nueva contraseña *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required={!!formData.currentPassword}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.accent }}
            placeholder="Repite la nueva contraseña"
          />
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.success.bg, color: COLORS.success.text }}>
          ✓ Datos actualizados exitosamente
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: COLORS.error.bg, color: COLORS.error.text }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: COLORS.light, color: COLORS.secondary }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary }}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
