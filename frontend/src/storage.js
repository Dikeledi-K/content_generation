const HISTORY_KEY = 'createai.history';
const SAVED_KEY = 'createai.saved';

function readList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function getLocalHistory() {
  return readList(HISTORY_KEY);
}

export function recordGeneration(item) {
  const entries = readList(HISTORY_KEY).filter((entry) => entry.id !== item.id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...entries]));
}

export function getSavedItems() {
  return readList(SAVED_KEY);
}

export function saveGeneratedItem(item) {
  const entries = readList(SAVED_KEY).filter((entry) => entry.id !== item.id);
  window.localStorage.setItem(SAVED_KEY, JSON.stringify([item, ...entries]));
}