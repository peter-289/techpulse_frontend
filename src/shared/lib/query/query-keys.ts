export const queryKeys = {
  software: {
    all: ['software'] as const,
    list: (limit: number) => [...queryKeys.software.all, 'list', { limit }] as const,
  },
  support: {
    all: ['support'] as const,
    messages: (limit: number) => [...queryKeys.support.all, 'messages', { limit }] as const,
  },
};
