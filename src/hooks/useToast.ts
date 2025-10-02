import { useToast as useToastContext } from '../components/Toast';

export const useToast = () => {
  const { addToast } = useToastContext();

  const showSuccess = (message: string) => {
    addToast(message, 'success');
  };

  const showError = (message: string) => {
    addToast(message, 'error');
  };

  return {
    showSuccess,
    showError
  };
};