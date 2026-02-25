import { useState } from 'react';
import { profileService } from '../../services/profile.service';
import { useAuthStore } from '../../store/authSlice';

interface EditProfileFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditProfileForm = ({ onSuccess, onCancel }: EditProfileFormProps) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre no puede estar vacío');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (formData.password) {
      if (!formData.currentPassword) {
        setError('Debe ingresar la contraseña actual para cambiarla');
        return false;
      }

      if (formData.password.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: { name?: string; currentPassword?: string; password?: string } = {};
      
      if (formData.name.trim() !== user?.name) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.password) {
        updateData.currentPassword = formData.currentPassword;
        updateData.password = formData.password;
      }

      if (Object.keys(updateData).length === 0 || (Object.keys(updateData).length === 1 && updateData.currentPassword)) {
        setError('No hay cambios para guardar');
        setLoading(false);
        return;
      }

      const updatedProfile = await profileService.updateProfile(updateData);
      
      setUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
      });

      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#296374' }}>
          Email
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          style={{ borderColor: '#EDEDCE' }}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: '#296374' }}>
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
          style={{ borderColor: '#629FAD' }}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1" style={{ color: '#296374' }}>
          Contraseña actual
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ borderColor: '#629FAD' }}
          placeholder="Ingresa tu contraseña actual"
        />
        <p className="text-xs mt-1" style={{ color: '#629FAD' }}>
          Solo si deseas cambiar la contraseña
        </p>
      </div>

      {formData.currentPassword && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#296374' }}>
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
            style={{ borderColor: '#629FAD' }}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      )}

      {formData.currentPassword && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: '#296374' }}>
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
            style={{ borderColor: '#629FAD' }}
            placeholder="Repite la nueva contraseña"
          />
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#d4edda', color: '#155724' }}>
          Datos actualizados exitosamente
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#fee', color: '#c00' }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#EDEDCE', color: '#296374' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#0C2C55' }}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
