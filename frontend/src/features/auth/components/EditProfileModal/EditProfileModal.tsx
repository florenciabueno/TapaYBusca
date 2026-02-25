import { EditProfileForm } from '../EditProfileForm';
import { COLORS } from '../../../../config/theme';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2
          id="modal-title"
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.primary }}
        >
          Editar perfil
        </h2>

        <EditProfileForm onSuccess={handleSuccess} onCancel={onClose} />
      </div>
    </div>
  );
};
