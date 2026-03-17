import env from '../config/env.config';

/**
 * @returns true if the current process is running in a test environment.
 */
export const isDev = (): boolean => {
  return env.environment === 'development';
};
