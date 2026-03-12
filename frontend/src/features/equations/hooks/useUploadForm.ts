import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import { queryKeys } from '../../../shared/query-keys';
import { useDismissAfterDelay } from '../../../shared/hooks/useDismissAfterDelay';
import { useUploadableEquations } from './useUploadableEquations';

const UPLOAD_SUCCESS = 'Ecuaciones subidas correctamente. Se han compartido con el resto de estudiantes.';
const UPLOAD_SELECT_AT_LEAST_ONE = 'Selecciona al menos una ecuación para subir.';
const SUCCESS_MESSAGE_DURATION_MS = 4000;

export type UploadTab = 'can-upload' | 'already-uploaded';

export function useUploadForm() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const { uploadableEquations, isLoading, error } = useUploadableEquations();
  const [activeTab, setActiveTab] = useState<UploadTab>('can-upload');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useDismissAfterDelay<string | null>(null, SUCCESS_MESSAGE_DURATION_MS);
  const [validationError, setValidationError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (ids: string[]) => equationService.uploadEquations(ids, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.all });
      setSuccess(UPLOAD_SUCCESS);
      setSelectedIds(new Set());
    },
  });

  const isSubmitting = uploadMutation.isPending;
  const submitError =
    validationError ||
    (uploadMutation.error != null
      ? uploadMutation.error instanceof Error
        ? uploadMutation.error.message
        : 'Error al subir ecuaciones'
      : null);

  const canUploadList = uploadableEquations.filter((e) => !e.isPublished);
  const alreadyUploadedList = uploadableEquations.filter((e) => e.isPublished);

  const handleToggle = useCallback((id: string) => {
    const item = uploadableEquations.find((e) => e.id === id);
    if (item?.isPublished) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setValidationError(null);
    uploadMutation.reset();
  }, [uploadableEquations, uploadMutation]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      uploadMutation.reset();
      setSuccess(null);
      setValidationError(null);
      const ids = Array.from(selectedIds);
      if (ids.length === 0) {
        setValidationError(UPLOAD_SELECT_AT_LEAST_ONE);
        return;
      }
      uploadMutation.mutate(ids);
    },
    [selectedIds, uploadMutation]
  );

  return {
    uploadableEquations,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    selectedIds,
    canUploadList,
    alreadyUploadedList,
    success,
    submitError,
    isSubmitting,
    handleToggle,
    handleSubmit,
  };
}
