import React from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  show: boolean;
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  show,
  onDismiss,
}) => {
  const typeClasses = {
    success: 'bg-green-50 text-green-800',
    error: 'bg-red-50 text-red-800',
    warning: 'bg-yellow-50 text-yellow-800',
    info: 'bg-blue-50 text-blue-800',
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  return (
    <Transition
      show={show}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={`rounded-md p-4 ${typeClasses[type]}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {/* Alert Icon goes here */}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">{title}</h3>
            {message && (
              <div className="mt-2 text-sm opacity-90">{message}</div>
            )}
          </div>
          {onDismiss && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    typeClasses[type]
                  }`}
                  onClick={onDismiss}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Transition>
  );
};

export default Alert;