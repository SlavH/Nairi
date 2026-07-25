// OPFS-backed binary storage for embedding vectors. Each book gets one file
// holding all chunk vectors concatenated as Float32, plus a small header
// recording the per-vector dimension so readers can split it back apart.
//
// When OPFS is unavailable (e.g. Firefox private mode, some mobile browsers),
// falls back to storing vectors as ArrayBuffer blobs in IndexedDB.

const DIM = 384 // all-MiniLM-L6-v2 output dimension

export function isOpfsAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.storage?.getDirectory
  )
}

export async function saveVectors(bookId: string, vectors: Float32Array[]): Promise<void> {
  if (!isOpfsAvailable()) {
    await saveVectorsIdb(bookId, vectors)
    return
  }
  const root = await navigator.storage.getDirectory()
  const fileHandle = await root.getFileHandle(`${bookId}.vec`, { create: true })
  const writable = await fileHandle.createWritable()

  // Header: [magic(4 bytes "NVec"), version(uint32), dim(uint32), count(uint32)]
  const header = new ArrayBuffer(4 + 4 + 4 + 4)
  const hv = new DataView(header)
  const enc = new TextEncoder()
  const magic = enc.encode("NVec")
  for (let i = 0; i < 4; i++) hv.setUint8(i, magic[i])
  hv.setUint32(4, 1, true)
  hv.setUint32(8, DIM, true)
  hv.setUint32(12, vectors.length, true)
  await writable.write(header)

  for (const vec of vectors) {
    // Pad/truncate to DIM to be safe against model drift.
    const buf = new ArrayBuffer(DIM * 4)
    const fv = new Float32Array(buf)
    fv.set(vec.subarray(0, DIM))
    await writable.write(buf)
  }
  await writable.close()
}

export async function loadVectors(bookId: string): Promise<Float32Array[]> {
  if (!isOpfsAvailable()) {
    return loadVectorsIdb(bookId)
  }
  const root = await navigator.storage.getDirectory()
  let fileHandle: FileSystemFileHandle
  try {
    fileHandle = await root.getFileHandle(`${bookId}.vec`)
  } catch {
    return []
  }
  const file = await fileHandle.getFile()
  const ab = await file.arrayBuffer()
  const dv = new DataView(ab)
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3))
  if (magic !== "NVec") throw new Error("Corrupt vector file.")
  const dim = dv.getUint32(8, true)
  const count = dv.getUint32(12, true)
  const vectors: Float32Array[] = []
  let offset = 16
  for (let i = 0; i < count; i++) {
    const vec = new Float32Array(dim)
    for (let j = 0; j < dim; j++) vec[j] = dv.getFloat32(offset + j * 4, true)
    vectors.push(vec)
    offset += dim * 4
  }
  return vectors
}

// ---- IndexedDB fallback ----

interface VectorRecord {
  book_id: string
  dim: number
  count: number
  /** Flat Float32Array serialized as base64 */
  data: string
}

async function saveVectorsIdb(bookId: string, vectors: Float32Array[]): Promise<void> {
  const { idbPut, STORES } = await import("./db")
  const totalDim = DIM * vectors.length
  const flat = new Float32Array(totalDim)
  let offset = 0
  for (const vec of vectors) {
    const truncated = vec.subarray(0, DIM)
    flat.set(truncated, offset)
    offset += DIM
  }
  // Serialize to base64 via Uint8Array
  const bytes = new Uint8Array(flat.buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const data = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64")
  await idbPut(STORES.vectors, { book_id: bookId, dim: DIM, count: vectors.length, data } satisfies VectorRecord)
}

async function loadVectorsIdb(bookId: string): Promise<Float32Array[]> {
  const { idbGet, STORES } = await import("./db")
  const rec = await idbGet<VectorRecord>(STORES.vectors, bookId)
  if (!rec) return []
  const binary = typeof atob === "function" ? atob(rec.data) : Buffer.from(rec.data, "base64").toString("binary")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const flat = new Float32Array(bytes.buffer)
  const vectors: Float32Array[] = []
  for (let i = 0; i < rec.count; i++) {
    vectors.push(flat.slice(i * rec.dim, (i + 1) * rec.dim))
  }
  return vectors
}

const VECTOR_DIM = DIM
