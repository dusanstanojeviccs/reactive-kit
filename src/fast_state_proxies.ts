import { useMemo } from 'react'
import { FastStateProxy } from './proxies/object'
import { ArrayWrapper } from './proxies/array_wrapper'
import { MapWrapper } from './proxies/map_wrapper'
import { SetWrapper } from './proxies/set_wrapper'

export const isPrimitive = (obj: any) => {
  const type = typeof obj
  return (
    type === 'string' ||
    obj instanceof String ||
    type === 'number' ||
    obj instanceof Number ||
    type === 'boolean' ||
    obj instanceof Boolean
  )
}

const fastStateMap = new WeakMap<object, any>()

export const getFastState = (obj: any) => {
  if (obj === undefined || obj === null) {
    return obj
  }
  if (fastStateMap.has(obj as any)) {
    return fastStateMap.get(obj as any)
  }

  if (isPrimitive(obj)) {
    return obj
  }

  let fastObj
  if (obj instanceof Array) {
    fastObj = new ArrayWrapper(obj)
  } else if (obj instanceof Map) {
    fastObj = new MapWrapper(obj)
  } else if (obj instanceof Set) {
    fastObj = new SetWrapper(obj)
  } else if (obj instanceof Object) {
    const proxyHandler = FastStateProxy

    fastObj = new Proxy(obj, proxyHandler)
  } else {
    fastObj = obj
  }

  fastStateMap.set(obj as any, fastObj)

  return fastObj
}

export function useFastState<T>(initial: T): T {
  // use fast state is based on a weak map that creates an observable object
  // for each non observable object that the user has
  // the observable object is going through a proxy object that is returned
  // when ever something on the fast object is accessed
  // arrays are wrapped in array proxies
  // objects are wrapped in object proxies
  // every method that potentially mutates an array and returnes a copy
  // also returns a mutable array proxy object
  if (typeof initial === 'function') {
    throw new Error('Functions are not state! Objects and arrays are cool tho')
  }

  return useMemo(() => getFastState(initial as object) as any, [initial])
}
