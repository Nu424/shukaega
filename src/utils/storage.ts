import type { StateStorage } from 'zustand/middleware'

const createInMemoryStorage = (): StateStorage => {
  const storage = new Map<string, string>()

  return {
    getItem: (name: string) => storage.get(name) ?? null,
    setItem: (name: string, value: string) => {
      storage.set(name, value)
    },
    removeItem: (name: string) => {
      storage.delete(name)
    },
  }
}

const canUseLocalStorage = (): boolean => {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return false
    }

    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.warn('[storage] localStorage is not available:', error)
    return false
  }
}

export const isLocalStorageAvailable = canUseLocalStorage()

export const safeStorage: StateStorage = isLocalStorageAvailable
  ? window.localStorage
  : createInMemoryStorage()

export const loadPersistedState = <T>(
  storage: StateStorage,
  key: string,
): Partial<T> | null => {
  try {
    const value = storage.getItem(key)
    if (value == null) return null
    if (typeof value !== 'string') {
      console.warn(`[storage] Unexpected async storage for ${key}`)
      return null
    }

    const parsed = JSON.parse(value) as { state?: Partial<T> }
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return parsed.state ?? null
    }

    return parsed as Partial<T>
  } catch (error) {
    console.warn(`[storage] Failed to parse persisted state for ${key}`, error)
    return null
  }
}

export const savePersistedState = <T>(
  storage: StateStorage,
  key: string,
  state: T,
): void => {
  try {
    const payload = JSON.stringify({ state, version: 0 })
    storage.setItem(key, payload)
  } catch (error) {
    console.warn(`[storage] Failed to save state for ${key}`, error)
  }
}

export const clearPersistedState = (
  storage: StateStorage,
  key: string,
): void => {
  try {
    storage.removeItem(key)
  } catch (error) {
    console.warn(`[storage] Failed to clear state for ${key}`, error)
  }
}
