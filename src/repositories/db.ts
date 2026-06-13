import type { BBQEvent, Session } from '../domain/types'

const DB_NAME = 'smokebuddy_v1'
const DB_VERSION = 1

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' })
        store.createIndex('eventId', 'eventId', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      _db = (event.target as IDBOpenDBRequest).result
      resolve(_db)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode)
        const store = transaction.objectStore(storeName)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

// ─── Events ───────────────────────────────────────────────────────────────────

export const EventRepository = {
  getAll(): Promise<BBQEvent[]> {
    return openDB().then(
      db =>
        new Promise((resolve, reject) => {
          const store = db.transaction('events', 'readonly').objectStore('events')
          const req = store.getAll()
          req.onsuccess = () => resolve(req.result as BBQEvent[])
          req.onerror = () => reject(req.error)
        }),
    )
  },

  getById(id: string): Promise<BBQEvent | null> {
    return tx<BBQEvent | undefined>('events', 'readonly', store => store.get(id)).then(
      r => r ?? null,
    )
  },

  save(event: BBQEvent): Promise<void> {
    return tx<IDBValidKey>('events', 'readwrite', store => store.put(event)).then(() => undefined)
  },

  delete(id: string): Promise<void> {
    return tx<undefined>('events', 'readwrite', store => store.delete(id)).then(() => undefined)
  },
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const SessionRepository = {
  getByEventId(eventId: string): Promise<Session | null> {
    return openDB().then(
      db =>
        new Promise((resolve, reject) => {
          const store = db
            .transaction('sessions', 'readonly')
            .objectStore('sessions')
          const index = store.index('eventId')
          const req = index.getAll(eventId)
          req.onsuccess = () => {
            const results = req.result as Session[]
            resolve(results.length > 0 ? results[results.length - 1] : null)
          }
          req.onerror = () => reject(req.error)
        }),
    )
  },

  getAllActive(): Promise<Session[]> {
    return openDB().then(
      db =>
        new Promise((resolve, reject) => {
          const store = db.transaction('sessions', 'readonly').objectStore('sessions')
          const req = store.getAll()
          req.onsuccess = () => resolve((req.result as Session[]).filter(s => s.status === 'active'))
          req.onerror = () => reject(req.error)
        }),
    )
  },

  save(session: Session): Promise<void> {
    return tx<IDBValidKey>('sessions', 'readwrite', store => store.put(session)).then(
      () => undefined,
    )
  },
}
