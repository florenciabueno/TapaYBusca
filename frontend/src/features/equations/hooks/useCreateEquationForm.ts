import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '../../../config/constants';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import { equationService } from '../services/equation.service';
import { mergeFormSubmitError } from '../../../shared/utils/formError';
import { useEquationMathInput } from './useEquationMathInput';

export const useCreateEquationForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [value, setValue] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { inputRef, inputHandlers, insertFromPad } = useEquationMathInput(value, setValue);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current !== null) {
        clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = null;
      }
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: (equation: string) => equationService.createEquation(equation, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.all });
      setSuccess('Ecuación guardada correctamente');
      setValue('');
      if (navigateTimerRef.current !== null) clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = setTimeout(() => {
        navigateTimerRef.current = null;
        navigate(ROUTES.DASHBOARD);
      }, 1500);
    },
  });

  const error = mergeFormSubmitError(
    validationError,
    createMutation.error,
    'Error al crear la ecuación'
  );

  const isLoading = createMutation.isPending;

  const handleSymbolClick = (insert: string) => {
    insertFromPad(insert);
    setValidationError(null);
    createMutation.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.reset();
    setSuccess(null);
    setValidationError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationError('Escribe una ecuación antes de guardar.');
      return;
    }
    createMutation.mutate(trimmed);
  };

  const handleClear = () => {
    setValue('');
    setValidationError(null);
    setSuccess(null);
    createMutation.reset();
  };

  const inputHandlersWithSideEffects = {
    ...inputHandlers,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      inputHandlers.onChange(e);
      setValidationError(null);
      createMutation.reset();
    },
  };

  return {
    inputRef,
    value,
    error,
    isLoading,
    success,
    inputHandlers: inputHandlersWithSideEffects,
    handleSymbolClick,
    handleSubmit,
    handleClear,
  };
};
