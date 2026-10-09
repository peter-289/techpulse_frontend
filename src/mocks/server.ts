import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server used exclusively by Vitest (see `src/setupTests.jsx`). */
export const server = setupServer(...handlers);
