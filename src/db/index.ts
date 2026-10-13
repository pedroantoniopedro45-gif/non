import type { StoreName } from '../types';

const DB_NAME = 'avicontrol-pro';
const DB_VERSION = 2;

const STORES: StoreName[] = [
  'lotes',
  'mortalidade',
  'racao',
  'pesagens',
  'agua',
  'saude',
  'lembretes',
  'despesas',
  'vendas',
  'metas',
  'pedidosLicenca',
];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const req = fn(transaction.objectStore(store));

        if (mode === 'readwrite') {
          // For write transactions, wait for the transaction to fully commit
          // before resolving — otherwise a subsequent read may not see the data.
          transaction.oncomplete = () => resolve(req.result);
          transaction.onerror = () => reject(transaction.error || req.error);
          transaction.onabort = () => reject(transaction.error || req.error);
        } else {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        }
      })
  );
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export async function getOne<T>(
  store: StoreName,
  id: string
): Promise<T | undefined> {
  return tx<T | undefined>(store, 'readonly', (s) =>
    s.get(id) as IDBRequest<T | undefined>
  );
}

export async function put<T extends { id: string }>(
  store: StoreName,
  value: T
): Promise<void> {
  await tx(store, 'readwrite', (s) => s.put(value));
}

export async function remove(store: StoreName, id: string): Promise<void> {
  await tx(store, 'readwrite', (s) => s.delete(id));
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    STORES.map((store) => tx(store, 'readwrite', (s) => s.clear()))
  );
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
