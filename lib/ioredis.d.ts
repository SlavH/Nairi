/** Type declarations for optional dependency ioredis (used when REDIS_URL is set) */
declare module 'ioredis' {
  interface RedisOptions {
    maxRetriesPerRequest?: number
  }
  interface RedisMulti {
    incr(key: string): RedisMulti
    pttl(key: string): RedisMulti
    exec(): Promise<[Error | null, unknown][] | null>
  }
  class Redis {
    constructor(url: string, options?: RedisOptions)
    get(key: string): Promise<string | null>
    set(key: string, value: string, px?: number): Promise<'OK' | null>
    incr(key: string): Promise<number>
    expire(key: string, seconds: number): Promise<number>
    pexpire(key: string, ms: number): Promise<number>
    del(key: string): Promise<number>
    multi(): RedisMulti
  }
  export default Redis
  export { Redis }
}
