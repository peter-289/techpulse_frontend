import React from 'react';

export function Input({ className = '', ...props }) {
  return <input className={`tp-field ${className}`} {...props} />;
}

export default Input;
