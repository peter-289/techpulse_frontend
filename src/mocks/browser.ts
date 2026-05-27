import { setupWorker } from 'msw/browser';
import { handlers } from './handlers/software.handlers';

export const worker = setupWorker(...handlers);
