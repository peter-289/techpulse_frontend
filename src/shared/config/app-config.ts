export const appConfig = {
  appName: 'TechPulse Control Plane',
  apiBaseUrl:
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.REACT_APP_API_URL)) ||
    '',
};
