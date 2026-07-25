const STORAGE_KEY = "pollinations-key"

export function getPollinationsKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setPollinationsKey(key: string | null): void {
  if (typeof window === "undefined") return
  if (key === null) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  if (!key.startsWith("pk_")) {
    throw new Error("Invalid Pollinations key. Only publishable keys (pk_...) are supported. Do not enter your secret key (sk_...).")
  }
  localStorage.setItem(STORAGE_KEY, key)
}
