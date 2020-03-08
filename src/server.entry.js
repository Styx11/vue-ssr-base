import createRootApp from './app';

export function createApp(context) {
  const app = createRootApp();

  return { app };
};