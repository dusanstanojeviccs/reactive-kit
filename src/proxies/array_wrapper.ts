import { notifyAll, observe } from '../core'
import { getFastState } from '../fast_state_proxies'
import { IterableIteratorWrapper } from './iterable_iterator_wrapper'

const FULL_ARRAY_FIELD = 'array'

export class ArrayWrapper<T> implements Array<T> {
  #wrappedArray: T[]

  static ArrayWrapperProxy = {
    get<T extends ArrayWrapper<M>, P extends PropertyKey, M>(
      target: T,
      propertyKey: P,
      receiver?: unknown,
    ): P extends keyof T ? T[P] : any {
      if (!Number.isNaN(Number(propertyKey))) {
        observe(target, FULL_ARRAY_FIELD)
        return getFastState(Reflect.get(target._wrappedArray, propertyKey, receiver)) as any
      }
      let ret = Reflect.get(target, propertyKey, receiver)
      if (typeof ret === 'function') {
        ret = ret.bind(target)
      }
      return ret
    },
    set<T extends ArrayWrapper<M>, P extends PropertyKey, M>(
      target: T,
      propertyKey: P,
      value: P extends keyof T ? T[P] : any,
      receiver?: any,
    ): boolean {
      if (!Number.isNaN(Number(propertyKey))) {
        const result = Reflect.set(target.#wrappedArray, propertyKey, value)
        notifyAll(target, FULL_ARRAY_FIELD)
        return result
      }
      return Reflect.set(target, propertyKey, value, receiver)
    },
  }

  get _wrappedArray() {
    return this.#wrappedArray
  }

  constructor(wrappedArray: T[]) {
    this.#wrappedArray = wrappedArray

    this[Symbol.unscopables] = this.#wrappedArray[Symbol.unscopables]

    const proxyHandler: ProxyHandler<ArrayWrapper<T>> = ArrayWrapper.ArrayWrapperProxy
    return new Proxy(this, proxyHandler)
  }

  /**
   * Returns a new array with all sub-array elements concatenated into it recursively up to the
   * specified depth.
   *
   * @param depth The maximum recursion depth
   */
  flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[] {
    return Array.prototype.flat.call(this, depth) as any
  }

  [Symbol.unscopables]!: {
    [K in keyof any[]]?: boolean
  }

  /**
   * Returns the value of the last element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate findLast calls predicate once for each element of the array, in descending
   * order, until it finds one where predicate returns true. If such an element is found, findLast
   * immediately returns that element value. Otherwise, findLast returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findLast<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S | undefined
  findLast(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T | undefined {
    observe(this, FULL_ARRAY_FIELD)
    return getFastState(this.#wrappedArray.findLast(predicate, thisArg))
  }

  /**
   * Returns the index of the last element in the array where predicate is true, and -1
   * otherwise.
   * @param predicate findLastIndex calls predicate once for each element of the array, in descending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findLastIndex(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): number {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.findLastIndex(predicate, thisArg)
  }

  /**
   * Determines whether an array includes a certain element, returning true or false as appropriate.
   * @param searchElement The element to search for.
   * @param fromIndex The position in this array at which to begin searching for searchElement.
   */
  includes(searchElement: T, fromIndex?: number): boolean {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.includes(searchElement, fromIndex)
  }

  at(n: number): T {
    return getFastState(this.#wrappedArray[n])
  }

  /**
   * Calls a defined callback function on each element of an array. Then, flattens the result into
   * a new array.
   * This is identical to a map followed by flat with depth 1.
   *
   * @param callback A function that accepts up to three arguments. The flatMap method calls the
   * callback function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callback function. If
   * thisArg is omitted, undefined is used as the this value.
   */
  flatMap<U, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
    thisArg?: This,
  ): U[] {
    observe(this, FULL_ARRAY_FIELD)
    return getFastState(this.#wrappedArray.flatMap(callback, thisArg))
  }

  // /** Iterator */
  [Symbol.iterator](): IterableIterator<T> {
    observe(this, FULL_ARRAY_FIELD)
    return new IterableIteratorWrapper<T>(this.#wrappedArray[Symbol.iterator]())
  }

  // /**
  //  * Returns an iterable of key, value pairs for every entry in the array
  //  */
  entries(): IterableIterator<[number, T]> {
    observe(this, FULL_ARRAY_FIELD)
    return new IterableIteratorWrapper<[number, T]>(this.#wrappedArray.entries())
  }

  // /**
  //  * Returns an iterable of keys in the array
  //  */
  keys(): IterableIterator<number> {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.keys()
  }

  // /**
  //  * Returns an iterable of values in the array
  //  */
  values(): IterableIterator<T> {
    observe(this, FULL_ARRAY_FIELD)
    return new IterableIteratorWrapper<T>(this.#wrappedArray.values())
  }

  /**
   * Returns the value of the first element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined
  find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.find(predicate, thisArg)
  }

  /**
   * Returns the index of the first element in the array where predicate is true, and -1
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.findIndex(predicate, thisArg)
  }

  /**
   * Changes all array elements from `start` to `end` index to a static `value` and returns the modified array
   * @param value value to fill array section with
   * @param start index to start filling the array at. If start is negative, it is treated as
   * length+start where length is the length of the array.
   * @param end index to stop filling the array at. If end is negative, it is treated as
   * length+end.
   */
  fill(value: T, start?: number, end?: number): this {
    this.#wrappedArray.fill(value, start, end)
    notifyAll(this, FULL_ARRAY_FIELD)
    return this
  }

  /**
   * Returns the this object after copying a section of the array identified by start and end
   * to the same array starting at position target
   * @param target If target is negative, it is treated as length+target where length is the
   * length of the array.
   * @param start If start is negative, it is treated as length+start. If end is negative, it
   * is treated as length+end.
   * @param end If not specified, length of the this object is used as its default value.
   */
  copyWithin(target: number, start: number, end?: number): this {
    notifyAll(this, FULL_ARRAY_FIELD)
    this.#wrappedArray.copyWithin(target, start, end)
    return this
  }

  get length(): number {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.length
  }
  toString(): string {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.toString()
  }
  toLocaleString(): string {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.toLocaleString()
  }
  /**
   * Removes the last element from an array and returns it.
   * If the array is empty, undefined is returned and the array is not modified.
   */
  pop(): T | undefined {
    if (this.length > 0) {
      const elem = this.#wrappedArray.pop()
      notifyAll(this, FULL_ARRAY_FIELD)
      return elem
    }
    return undefined
  }
  /**
   * Appends new elements to the end of an array, and returns the new length of the array.
   * @param items New elements to add to the array.
   */
  push(...items: T[]): number {
    const response = this.#wrappedArray.push(...items)
    notifyAll(this, FULL_ARRAY_FIELD)
    return response
  }
  /**
   * Combines two or more arrays.
   * This method returns a new array without modifying any existing arrays.
   * @param items Additional arrays and/or items to add to the end of the array.
   */
  concat(...items: (T | ConcatArray<T>)[]): T[] {
    observe(this, FULL_ARRAY_FIELD)
    return getFastState(this.#wrappedArray.concat(...items))
  }
  /**
   * Adds all the elements of an array into a string, separated by the specified separator string.
   * @param separator A string used to separate one element of the array from the next in the resulting string. If omitted, the array elements are separated with a comma.
   */
  join(separator?: string): string {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.join(separator)
  }
  /**
   * Reverses the elements in an array in place.
   * This method mutates the array and returns a reference to the same array.
   */
  reverse(): T[] {
    this.#wrappedArray.reverse()
    notifyAll(this, FULL_ARRAY_FIELD)
    return this
  }
  /**
   * Removes the first element from an array and returns it.
   * If the array is empty, undefined is returned and the array is not modified.
   */
  shift(): T | undefined {
    if (this.length > 0) {
      const elem = this.#wrappedArray.shift()
      notifyAll(this, FULL_ARRAY_FIELD)
      return elem
    }
    return undefined
  }
  /**
   * Returns a copy of a section of an array.
   * For both start and end, a negative index can be used to indicate an offset from the end of the array.
   * For example, -2 refers to the second to last element of the array.
   * @param start The beginning index of the specified portion of the array.
   * If start is undefined, then the slice begins at index 0.
   * @param end The end index of the specified portion of the array. This is exclusive of the element at the index 'end'.
   * If end is undefined, then the slice extends to the end of the array.
   */
  slice(start?: number, end?: number): T[] {
    observe(this, FULL_ARRAY_FIELD)
    return getFastState(this.slice(start, end))
  }
  /**
   * Sorts an array in place.
   * This method mutates the array and returns a reference to the same array.
   * @param compareFn Function used to determine the order of the elements. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
   * ```ts
   * [11,2,22,1].sort((a, b) => a - b)
   * ```
   */
  sort(compareFn?: (a: T, b: T) => number): this {
    this.sort(compareFn)
    notifyAll(this, FULL_ARRAY_FIELD)
    return this
  }
  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @returns An array containing the elements that were deleted.
   */
  splice(start: number, deleteCount?: number): T[]
  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the array in place of the deleted elements.
   * @returns An array containing the elements that were deleted.
   */
  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    const deleted = this.#wrappedArray.splice(start, deleteCount, ...items)
    notifyAll(this, FULL_ARRAY_FIELD)
    return deleted
  }
  /**
   * Inserts new elements at the start of an array, and returns the new length of the array.
   * @param items Elements to insert at the start of the array.
   */
  unshift(...items: T[]): number {
    const num = this.#wrappedArray.unshift(...items)
    notifyAll(this, FULL_ARRAY_FIELD)
    return num
  }
  /**
   * Returns the index of the first occurrence of a value in an array, or -1 if it is not present.
   * @param searchElement The value to locate in the array.
   * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
   */
  indexOf(searchElement: T, fromIndex?: number): number {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).indexOf(searchElement, fromIndex)
  }
  /**
   * Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.
   * @param searchElement The value to locate in the array.
   * @param fromIndex The array index at which to begin searching backward. If fromIndex is omitted, the search starts at the last index in the array.
   */
  lastIndexOf(searchElement: T, fromIndex?: number): number {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).lastIndexOf(searchElement, fromIndex)
  }
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): this is S[]
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).every(predicate, thisArg)
  }
  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param predicate A function that accepts up to three arguments. The some method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value true, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  some(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).some(predicate, thisArg)
  }
  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
   * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).forEach(callbackfn, thisArg)
  }
  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).map(callbackfn, thisArg) as U[]
  }
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[]
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[] {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).filter(predicate, thisArg)
  }
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduce<U>(
    callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue?: U,
  ): U {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).reduce(callbackfn, initialValue as any) as any
  }
  /**
   * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T
  reduceRight(
    callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    initialValue?: T,
  ): T
  /**
   * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduceRight<U>(
    callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue?: U,
  ): U {
    observe(this, FULL_ARRAY_FIELD)
    return this.#wrappedArray.map((e) => getFastState(e)).reduceRight(callbackfn, initialValue as any) as any
  }

  [n: number]: T
}
