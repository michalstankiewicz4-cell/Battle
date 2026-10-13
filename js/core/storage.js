// localStorage wrappers (all failures are swallowed: private mode, blocked storage, quota...).
export const KEYS = { save: 'salvo:save:v1', settings: 'salvo:settings:v1' };

export function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
export function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}
