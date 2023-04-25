import { notifyAll, observe } from '../core'
import { getFastState } from '../fast_state_proxies'
import { IterableIteratorWrapper } from './iterable_iterator_wrapper'

const FULL_MAP_FIELD = 'map'

export class MapWrapper<K, V> implements Map<K, V> {
  #wrappedMap: Map<K, V>

  constructor(wrappedMap: Map<K, V>) {
    this.#wrappedMap = wrappedMap
  }
  clear(): void {
    const keys = [...this.#wrappedMap.keys()]

    this.#wrappedMap.clear()

    keys.forEach((key) => notifyAll(this, key))
    notifyAll(this, FULL_MAP_FIELD)
  }
  delete(key: K): boolean {
    const response = this.#wrappedMap.delete(key)
    notifyAll(this, key)
    notifyAll(this, FULL_MAP_FIELD)
    return response
  }
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this.#wrappedMap.forEach((_, k) => observe(this, k))
    observe(this, FULL_MAP_FIELD)
    this.#wrappedMap.forEach(callbackfn, thisArg)
  }
  get(key: K): V | undefined {
    observe(this, key)
    const obj = this.#wrappedMap.get(key)
    if (obj === undefined) {
      return undefined
    }
    return getFastState(obj)
  }
  has(key: K): boolean {
    observe(this, key)
    return this.#wrappedMap.has(key)
  }
  set(key: K, value: V): this {
    const notifyOnNew = !this.#wrappedMap.has(key)

    this.#wrappedMap.set(key, value)
    notifyAll(this, key)
    if (notifyOnNew) {
      notifyAll(this, FULL_MAP_FIELD)
    }
    return this
  }
  get size(): number {
    observe(this, FULL_MAP_FIELD)
    return this.#wrappedMap.size
  }
  entries(): IterableIterator<[K, V]> {
    this.#wrappedMap.forEach((_, k) => observe(this, k))
    observe(this, FULL_MAP_FIELD)

    return new IterableIteratorWrapper<[K, V]>(this.#wrappedMap.entries())
  }
  keys(): IterableIterator<K> {
    this.#wrappedMap.forEach((_, k) => observe(this, k))
    observe(this, FULL_MAP_FIELD)

    return new IterableIteratorWrapper<K>(this.#wrappedMap.keys())
  }
  values(): IterableIterator<V> {
    this.#wrappedMap.forEach((_, k) => observe(this, k))
    observe(this, FULL_MAP_FIELD)
    return new IterableIteratorWrapper<V>(this.#wrappedMap.values())
  }
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries()
  }
  get [Symbol.toStringTag]() {
    this.#wrappedMap.forEach((_, k) => observe(this, k))
    observe(this, FULL_MAP_FIELD)
    return this.#wrappedMap.toString()
  }
}
