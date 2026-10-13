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

// Browser storage can be full or blocked; a failed write should never break the page that triggered it.
function writeList(key, entries) {
  try {
    window.localStorage.setItem(key, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function getLocalHistory() {
  return readList(HISTORY_KEY);
}

export function mergeWithLocalHistory(serverHistory = []) {
  const combined = new Map([...serverHistory, ...getLocalHistory()].map((item) => [item.id, item]));
  return [...combined.values()].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

export function removeLocalHistoryItem(id) {
  writeList(HISTORY_KEY, readList(HISTORY_KEY).filter((entry) => entry.id !== id));
}

export function clearLocalHistory() {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function recordGeneration(item) {
  return writeList(HISTORY_KEY, [item, ...readList(HISTORY_KEY).filter((entry) => entry.id !== item.id)]);
}

export function getSavedItems() {
  return readList(SAVED_KEY);
}

export function removeSavedItem(id) {
  writeList(SAVED_KEY, readList(SAVED_KEY).filter((entry) => entry.id !== id));
}

export function saveGeneratedItem(item) {
  return writeList(SAVED_KEY, [item, ...readList(SAVED_KEY).filter((entry) => entry.id !== item.id)]);
}
