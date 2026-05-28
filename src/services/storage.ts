const PREFIX = 'mpaye_superadmin:';

export const secureStorage = {
  getItem: (key: string) =>
    Promise.resolve(localStorage.getItem(PREFIX + key)),
  setItem: (key: string, value: string) => {
    localStorage.setItem(PREFIX + key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    localStorage.removeItem(PREFIX + key);
    return Promise.resolve();
  },
  multiRemove: (keys: string[]) => {
    keys.forEach((k) => localStorage.removeItem(PREFIX + k));
    return Promise.resolve();
  },
};

export const asyncStorage = secureStorage;

const DEVICE_ID_KEY = PREFIX + 'deviceId';

export async function getOrCreateDeviceId(): Promise<string> {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      'web-admin-' +
      Math.random().toString(36).slice(2, 10) +
      '-' +
      Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
