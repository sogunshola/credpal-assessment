import env from '../config/env.config';

/**
 * @returns true if the current process is running in a test environment.
 */
export const isTest = (): boolean => {
  return env.environment === 'test';
};
