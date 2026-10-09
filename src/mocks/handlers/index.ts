import { handlers as softwareHandlers } from './software.handlers';
import { authHandlers } from './auth.handlers';
import { workspaceHandlers } from './workspace.handlers';

export const handlers = [...softwareHandlers, ...authHandlers, ...workspaceHandlers];
