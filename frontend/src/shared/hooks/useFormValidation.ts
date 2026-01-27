import { useState } from 'react';

export interface ValidationErrors {
  [key: string]: string | null;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  validateField: (name: string, value: string, validator: (value: string) => string | null) => void;
  validateForm: (validators: Record<string, (value: string) => string | null>, values: Record<string, string>) => boolean;
  clearError: (name: string) => void;
  clearAllErrors: () => void;
}

export const useFormValidation = (): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (name: string, value: string, validator: (value: string) => string | null) => {
    const error = validator(value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (
    validators: Record<string, (value: string) => string | null>,
    values: Record<string, string>
  ): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const error = validators[key](values[key] || '');
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const clearError = (name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
  };
};
