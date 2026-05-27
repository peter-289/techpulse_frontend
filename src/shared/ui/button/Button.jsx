import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = `tp-btn tp-btn-${variant}`;
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
