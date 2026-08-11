// Minimal IndexedDB wrapper for NairiBook core metadata (no vectors — those
// live in OPFS). One database, several object stores.
//
// Bump DB_VERSION and add a createObjectStore branch in onupgradeneeded when
// introducing a new store. New stores added in v2: exerciseCache, srState,
// gamification (client-side exercises + spaced-repetition layer). v3: problemCache
// (Socratic problem-solving tutor). v4: photoCheck (handwritten photo grading).

const DB_NAME = "nairibook"
const DB_VERSION = 6

export const STORES = {
  books: "books",
  chunks: "chunks",
  concepts: "concepts",
  graphs: "graphs",
  ragChat: "rag_chat",
  ragFeedback: "rag_feedback",
  // v2: exercises + SM-2 + gamification
  exerciseCache: "exercise_cache",
  srState: "sr_state",
  gamification: "gamification",
  // v3: Socratic problem solver
  problemCache: "problem_cache",
  // v4: handwritten photo check
  photoCheck: "photo_check",
  // v5: vector fallback for browsers without OPFS
  vectors: "vectors",
} as const

let dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.books)) db.createObjectStore(STORES.books, { keyPath: "book_id" })
      if (!db.objectStoreNames.contains(STORES.chunks)) db.createObjectStore(STORES.chunks, { keyPath: "book_id" })
      if (!db.objectStoreNames.contains(STORES.concepts)) db.createObjectStore(STORES.concepts, { keyPath: "book_id" })
      if (!db.objectStoreNames.contains(STORES.graphs)) db.createObjectStore(STORES.graphs, { keyPath: "book_id" })
      if (!db.objectStoreNames.contains(STORES.ragChat)) db.createObjectStore(STORES.ragChat, { keyPath: "notebookId" })
      if (!db.objectStoreNames.contains(STORES.ragFeedback)) db.createObjectStore(STORES.ragFeedback, { keyPath: "notebookId" })
      // v2 stores
      if (!db.objectStoreNames.contains(STORES.exerciseCache)) db.createObjectStore(STORES.exerciseCache, { keyPath: ["book_id", "concept_id"] })
      if (!db.objectStoreNames.contains(STORES.srState)) db.createObjectStore(STORES.srState, { keyPath: ["book_id", "concept_id"] })
      if (!db.objectStoreNames.contains(STORES.gamification)) db.createObjectStore(STORES.gamification, { keyPath: "book_id" })
      // v3 store
      if (!db.objectStoreNames.contains(STORES.problemCache)) db.createObjectStore(STORES.problemCache, { keyPath: ["book_id", "concept_id"] })
      // v4 store
      if (!db.objectStoreNames.contains(STORES.photoCheck)) db.createObjectStore(STORES.photoCheck, { keyPath: ["book_id", "problem_id"] })
      // v5 store — vector fallback when OPFS unavailable
      if (!db.objectStoreNames.contains(STORES.vectors)) db.createObjectStore(STORES.vectors, { keyPath: "book_id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store)
}

export async function idbPut(store: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, store, "readwrite").put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet<T>(store: string, key: string | string[]): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, store, "readonly").get(key as IDBValidKey)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, store, "readonly").getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function idbDelete(store: string, key: string | string[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, store, "readwrite").delete(key as IDBValidKey)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
