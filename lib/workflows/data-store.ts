/**
 * Nairi AI Workflow Builder - Data Store System
 * Built-in storage for workflow state and long-running processes
 */

import { DataStore, DataStoreEntry } from './types'

// ============================================================================
// In-Memory Data Store Implementation
// ============================================================================

class WorkflowDataStore {
  private stores: Map<string, DataStore> = new Map()
  private globalStore: Map<string, DataStoreEntry> = new Map()

  // ============================================================================
  // Store Management
  // ============================================================================

  createStore(name: string, description?: string): DataStore {
    const store: DataStore = {
      id: `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      entries: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.stores.set(store.id, store)
    return store
  }

  getStore(storeId: string): DataStore | undefined {
    return this.stores.get(storeId)
  }

  deleteStore(storeId: string): boolean {
    return this.stores.delete(storeId)
  }

  listStores(): DataStore[] {
    return Array.from(this.stores.values())
  }

  // ============================================================================
  // Global Key-Value Operations
  // ============================================================================

  async get(key: string): Promise<any> {
    const entry = this.globalStore.get(key)
    if (!entry) return undefined

    // Check expiration
    if (entry.expiresAt && new Date() > entry.expiresAt) {
      this.globalStore.delete(key)
      return undefined
    }

    return entry.value
  }

  async set(key: string, value: any, options?: { ttl?: number; workflowId?: string; executionId?: string }): Promise<void> {
    const entry: DataStoreEntry = {
      key,
      value,
      type: typeof value,
      createdAt: new Date(),
      updatedAt: new Date(),
      workflowId: options?.workflowId,
      executionId: options?.executionId,
    }

    if (options?.ttl) {
      entry.expiresAt = new Date(Date.now() + options.ttl)
    }

    this.globalStore.set(key, entry)
  }

  async delete(key: string): Promise<boolean> {
    return this.globalStore.delete(key)
  }

  async has(key: string): Promise<boolean> {
    const entry = this.globalStore.get(key)
    if (!entry) return false

    if (entry.expiresAt && new Date() > entry.expiresAt) {
      this.globalStore.delete(key)
      return false
    }

    return true
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.globalStore.keys())
    
    if (!pattern) return allKeys

    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return allKeys.filter(key => regex.test(key))
  }

  async clear(): Promise<void> {
    this.globalStore.clear()
  }

  // ============================================================================
  // Scoped Operations (by workflow or execution)
  // ============================================================================

  async getByWorkflow(workflowId: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {}
    
    for (const [key, entry] of this.globalStore.entries()) {
      if (entry.workflowId === workflowId) {
        if (!entry.expiresAt || new Date() <= entry.expiresAt) {
          result[key] = entry.value
        }
      }
    }

    return result
  }

  async getByExecution(executionId: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {}
    
    for (const [key, entry] of this.globalStore.entries()) {
      if (entry.executionId === executionId) {
        if (!entry.expiresAt || new Date() <= entry.expiresAt) {
          result[key] = entry.value
        }
      }
    }

    return result
  }

  async deleteByWorkflow(workflowId: string): Promise<number> {
    let count = 0
    
    for (const [key, entry] of this.globalStore.entries()) {
      if (entry.workflowId === workflowId) {
        this.globalStore.delete(key)
        count++
      }
    }

    return count
  }

  async deleteByExecution(executionId: string): Promise<number> {
    let count = 0
    
    for (const [key, entry] of this.globalStore.entries()) {
      if (entry.executionId === executionId) {
        this.globalStore.delete(key)
        count++
      }
    }

    return count
  }

  // ============================================================================
  // Atomic Operations
  // ============================================================================

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.get(key) || 0
    const newValue = Number(current) + amount
    await this.set(key, newValue)
    return newValue
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    return this.increment(key, -amount)
  }

  async append(key: string, value: any): Promise<any[]> {
    const current = await this.get(key) || []
    if (!Array.isArray(current)) {
      throw new Error(`Value at key "${key}" is not an array`)
    }
    current.push(value)
    await this.set(key, current)
    return current
  }

  async pop(key: string): Promise<any> {
    const current = await this.get(key) || []
    if (!Array.isArray(current)) {
      throw new Error(`Value at key "${key}" is not an array`)
    }
    const value = current.pop()
    await this.set(key, current)
    return value
  }

  // ============================================================================
  // Hash Operations
  // ============================================================================

  async hget(key: string, field: string): Promise<any> {
    const hash = await this.get(key) || {}
    return hash[field]
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    const hash = await this.get(key) || {}
    hash[field] = value
    await this.set(key, hash)
  }

  async hdel(key: string, field: string): Promise<boolean> {
    const hash = await this.get(key) || {}
    if (field in hash) {
      delete hash[field]
      await this.set(key, hash)
      return true
    }
    return false
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    return await this.get(key) || {}
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async cleanupExpired(): Promise<number> {
    let count = 0
    const now = new Date()

    for (const [key, entry] of this.globalStore.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.globalStore.delete(key)
        count++
      }
    }

    return count
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(): {
    totalKeys: number
    totalSize: number
    byWorkflow: Record<string, number>
    byType: Record<string, number>
  } {
    const stats = {
      totalKeys: this.globalStore.size,
      totalSize: 0,
      byWorkflow: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    }

    for (const entry of this.globalStore.values()) {
      // Estimate size
      stats.totalSize += JSON.stringify(entry.value).length

      // Count by workflow
      if (entry.workflowId) {
        stats.byWorkflow[entry.workflowId] = (stats.byWorkflow[entry.workflowId] || 0) + 1
      }

      // Count by type
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1
    }

    return stats
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const dataStore = new WorkflowDataStore()

// ============================================================================
// Variable System
// ============================================================================

export class VariableManager {
  private variables: Map<string, any> = new Map()
  private watchers: Map<string, Set<(value: any) => void>> = new Map()

  set(name: string, value: any): void {
    this.variables.set(name, value)
    this.notifyWatchers(name, value)
  }

  get(name: string): any {
    return this.variables.get(name)
  }

  has(name: string): boolean {
    return this.variables.has(name)
  }

  delete(name: string): boolean {
    return this.variables.delete(name)
  }

  getAll(): Record<string, any> {
    return Object.fromEntries(this.variables.entries())
  }

  setAll(variables: Record<string, any>): void {
    for (const [name, value] of Object.entries(variables)) {
      this.set(name, value)
    }
  }

  clear(): void {
    this.variables.clear()
  }

  watch(name: string, callback: (value: any) => void): () => void {
    if (!this.watchers.has(name)) {
      this.watchers.set(name, new Set())
    }
    this.watchers.get(name)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.watchers.get(name)?.delete(callback)
    }
  }

  private notifyWatchers(name: string, value: any): void {
    const callbacks = this.watchers.get(name)
    if (callbacks) {
      callbacks.forEach(cb => cb(value))
    }
  }
}

export const variableManager = new VariableManager()
