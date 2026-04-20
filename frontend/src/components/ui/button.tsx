import React from 'react';
import './button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    
    // Формируем строку классов вручную
    const classes = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      'btn-active',
      className
    ].filter(Boolean).join(' ');

    return (
      <button 
        ref={ref} 
        className={classes} 
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };