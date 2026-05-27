import React from 'react';

export default function Input({ className = '', ...props }) {
  return <input className={`tp-field ${className}`} {...props} />;
}
