import { isDev } from './isDev';

describe('isDev', () => {
  it('should return true if the current process is running in a development environment', () => {
    expect(isDev()).toBe(true);
  });
});
