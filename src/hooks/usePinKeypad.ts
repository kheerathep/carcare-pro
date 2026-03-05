import { useState, useEffect, useCallback } from 'react';

interface UsePinKeypadOptions {
  maxLength?: number;
  isDisabled?: boolean;
  onEnter?: () => void;
}

export const usePinKeypad = ({ maxLength = 6, isDisabled = false, onEnter }: UsePinKeypadOptions = {}) => {
  const [pin, setPin] = useState('');

  const handleNumberClick = useCallback((number: string) => {
    if (isDisabled) return;
    setPin((prev) => {
      if (prev.length >= maxLength) return prev;
      return prev + number;
    });
  }, [isDisabled, maxLength]);

  const handleBackspace = useCallback(() => {
    if (isDisabled) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isDisabled]);

  const handleClearPin = useCallback(() => {
    if (isDisabled) return;
    setPin('');
  }, [isDisabled]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) {
        handleNumberClick(event.key);
        return;
      }

      if (event.key === 'Backspace') {
        handleBackspace();
        return;
      }

      if (event.key === 'Escape') {
        handleClearPin();
        return;
      }

      if (event.key === 'Enter' && onEnter) {
        onEnter();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleNumberClick, handleBackspace, handleClearPin, onEnter]);

  return {
    pin,
    setPin,
    handleNumberClick,
    handleBackspace,
    handleClearPin,
  };
};
