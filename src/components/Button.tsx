import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  loadingText,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary': return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'success': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'danger': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'outline': return 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50';
      default: return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'md': return 'px-4 py-2 text-base';
      case 'lg': return 'px-5 py-2.5 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const baseClasses = 'rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={[
        baseClasses,
        getVariantClasses(),
        getSizeClasses(),
        widthClass,
        className,
        'flex items-center justify-center'
      ].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2 h-5 w-5">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2 h-5 w-5">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
