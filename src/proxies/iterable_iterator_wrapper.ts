import { getFastState } from '../fast_state_proxies'

export class IterableIteratorWrapper<T> implements IterableIterator<T> {
  #iterableIterator: IterableIterator<T>
  constructor(iterableIterator: IterableIterator<T>) {
    this.#iterableIterator = iterableIterator
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this
  }
  next(...args: [] | [undefined]): IteratorResult<T, any> {
    const result = this.#iterableIterator.next(...args)

    result.value = getFastState(result.value)

    return result
  }
  return?(value?: any): IteratorResult<T, any> {
    const result = this.#iterableIterator.return?.(value)

    if (result) {
      result.value = getFastState(result.value)
    }

    throw new Error('Method not implemented.')
  }
  throw?(e?: any): IteratorResult<T, any> {
    const result = this.#iterableIterator.throw?.(e)

    if (result) {
      result.value = getFastState(result.value)
    }

    throw new Error('Method not implemented.')
  }
}
