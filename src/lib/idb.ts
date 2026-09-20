import type { StateStorage } from "zustand/middleware";

const DB_NAME = "moor-linux";
const STORE = "kv";

function memory(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const fallback: Storage = typeof localStorage === "undefined" ? memory() : localStorage;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof indexedDB === "undefined") return fallback.getItem(name);
    const db = await openDb();
    const fromIdb = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(name);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (fromIdb != null) return fromIdb;
    try {
      const legacy = fallback.getItem(name);
      if (legacy) {
        await idbStorage.setItem(name, legacy);
        return legacy;
      }
    } catch {
      /* ignore */
    }
    return null;
  },
  setItem: async (name, value) => {
    if (typeof indexedDB === "undefined") {
      fallback.setItem(name, value);
      return;
    }
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  removeItem: async (name) => {
    if (typeof indexedDB === "undefined") {
      fallback.removeItem(name);
      return;
    }
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
