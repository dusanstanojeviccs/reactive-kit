import { notifyAll, observe } from '../core'
import { IterableIteratorWrapper } from './iterable_iterator_wrapper'

const FULL_SET_FIELD = 'set'

export class SetWrapper<V> implements Set<V> {
  #wrappedSet: Set<V>

  constructor(wrappedSet: Set<V>) {
    this.#wrappedSet = wrappedSet
  }
  add(value: V): this {
    this.#wrappedSet.add(value)
    notifyAll(this, FULL_SET_FIELD)
    return this
  }
  clear(): void {
    this.#wrappedSet.clear()
    notifyAll(this, FULL_SET_FIELD)
  }
  delete(value: V): boolean {
    const result = this.#wrappedSet.delete(value)
    notifyAll(this, FULL_SET_FIELD)
    return result
  }
  forEach(callbackfn: (value: V, value2: V, set: Set<V>) => void, thisArg?: any): void {
    observe(this, FULL_SET_FIELD)
    this.#wrappedSet.forEach(callbackfn, thisArg)
  }
  has(value: V): boolean {
    observe(this, FULL_SET_FIELD)
    return this.#wrappedSet.has(value)
  }
  get size(): number {
    observe(this, FULL_SET_FIELD)
    return this.#wrappedSet.size
  }
  entries(): IterableIterator<[V, V]> {
    observe(this, FULL_SET_FIELD)
    return new IterableIteratorWrapper<[V, V]>(this.#wrappedSet.entries())
  }
  keys(): IterableIterator<V> {
    observe(this, FULL_SET_FIELD)
    return new IterableIteratorWrapper<V>(this.#wrappedSet.keys())
  }
  values(): IterableIterator<V> {
    observe(this, FULL_SET_FIELD)
    return new IterableIteratorWrapper<V>(this.#wrappedSet.values())
  }
  [Symbol.iterator](): IterableIterator<V> {
    return this.keys()
  }
  get [Symbol.toStringTag](): string {
    observe(this, FULL_SET_FIELD)
    return this.#wrappedSet.toString()
  }
}
