/** Browser-local storage for uploaded user-message background images. */

const DATABASE_NAME = 'dsh-im-chat-appearance'
const STORE_NAME = 'background-images'
const DATABASE_VERSION = 1
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** One locally stored background image. */
export interface StoredBackgroundImage {
  id: string
  blob: Blob
  name: string
  type: string
  updatedAt: number
}

/** User-visible image validation failure. */
export class BackgroundImageError extends Error {
  /**
   * @param code - stable failure category.
   * @param message - diagnostic message.
   */
  constructor(readonly code: 'type' | 'size' | 'storage', message: string) {
    super(message)
    this.name = 'BackgroundImageError'
  }
}

function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new BackgroundImageError('storage', 'IndexedDB is unavailable'))
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => { resolve(request.result) }
    request.onerror = () => {
      reject(new BackgroundImageError('storage', request.error?.message ?? 'IndexedDB open failed'))
    }
  })
}

function complete<T>(transaction: IDBTransaction, request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => { resolve(request.result) }
    request.onerror = () => {
      reject(new BackgroundImageError('storage', request.error?.message ?? 'IndexedDB request failed'))
    }
    transaction.onerror = () => {
      reject(new BackgroundImageError('storage', transaction.error?.message ?? 'IndexedDB transaction failed'))
    }
  })
}

/**
 * Create a durable local identifier for a selected background image.
 * @returns opaque identifier.
 */
export function newBackgroundImageId(): string {
  return `bg-${crypto.randomUUID()}`
}

/**
 * Validate and save a selected browser image.
 * @param id - identifier already stored in DSH settings.
 * @param file - selected local image.
 * @returns the stored record.
 */
export async function saveBackgroundImage(id: string, file: File): Promise<StoredBackgroundImage> {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new BackgroundImageError('type', `Unsupported image type: ${file.type || 'unknown'}`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new BackgroundImageError('size', `Image exceeds ${MAX_IMAGE_BYTES} bytes`)
  }
  const record: StoredBackgroundImage = {
    id,
    blob: file.slice(0, file.size, file.type),
    name: file.name,
    type: file.type,
    updatedAt: Date.now(),
  }
  const db = await database()
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    await complete(transaction, transaction.objectStore(STORE_NAME).put(record))
    return record
  } finally {
    db.close()
  }
}

/**
 * Read a locally stored background image.
 * @param id - background image identifier.
 * @returns the record, or undefined when the browser no longer has it.
 */
export async function loadBackgroundImage(id: string): Promise<StoredBackgroundImage | undefined> {
  if (id === '') return undefined
  const db = await database()
  try {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    return await complete(
      transaction,
      transaction.objectStore(STORE_NAME).get(id) as IDBRequest<StoredBackgroundImage | undefined>,
    )
  } finally {
    db.close()
  }
}

/**
 * Delete a locally stored background image.
 * @param id - background image identifier.
 * @returns completion after the record is removed.
 */
export async function deleteBackgroundImage(id: string): Promise<void> {
  if (id === '') return
  const db = await database()
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    await complete(transaction, transaction.objectStore(STORE_NAME).delete(id))
  } finally {
    db.close()
  }
}
