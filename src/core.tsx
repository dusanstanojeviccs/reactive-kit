import { useCallback, useMemo, useState } from 'react'

export type ComputationContext = {
  onInvalidate: () => void
  getRef: () => number
}

const computationsRunning: ComputationContext[] = []
const registerComputationStart = (context: ComputationContext) => {
  // we are not doing anything here because when we run the notify method if the observation ref is not the
  // current ref we can just remove
  computationsRunning.push(context)
}
const registerComputationEnd = (context: ComputationContext) => {
  if (context != computationsRunning.pop()) {
    throw new Error('You have started a watcher before another watcher has finished - this is illegal')
  }
}

type Observation = {
  computationCacheWeakRef: WeakRef<ComputationContext>
  ref: number
}
type ObservationMap = Map<any, Observation[]>
export const observers = new WeakMap<object, ObservationMap>()

// at most one weak ref per computation context
const computationContextWeakRefCache = new WeakMap<ComputationContext, WeakRef<ComputationContext>>()
const getComputationContextWeakRef = (computationContext: ComputationContext): WeakRef<ComputationContext> => {
  if (computationContextWeakRefCache.has(computationContext)) {
    return computationContextWeakRefCache.get(computationContext)!
  }
  const weakRef = new WeakRef(computationContext)
  computationContextWeakRefCache.set(computationContext, weakRef)
  return weakRef
}

const observationCache = new WeakMap<WeakRef<ComputationContext>, Map<number, Observation>>()
const getObservation = (computationCache: ComputationContext): Observation => {
  const computationCacheWeakRef: WeakRef<ComputationContext> = getComputationContextWeakRef(computationCache)

  if (!observationCache.has(computationCacheWeakRef)) {
    observationCache.set(computationCacheWeakRef, new Map())
  }
  const observationNumCache: Map<number, Observation> = observationCache.get(computationCacheWeakRef)!
  const ref: number = computationCache.getRef()

  if (observationNumCache.has(ref)) {
    return observationNumCache.get(ref)!
  } else {
    const observation: Observation = {
      ref,
      computationCacheWeakRef,
    }
    observationNumCache.set(ref, observation)
    return observation
  }
}

export const observe = (observedObject: object, field: any) => {
  if (computationsRunning.length) {
    const lastComputationContext: ComputationContext = computationsRunning[computationsRunning.length - 1]
    registerObserver(observedObject, field, lastComputationContext)
  }
}

const registerObserver = (observedObject: object, field: any, computationContext: ComputationContext) => {
  let observations: ObservationMap

  if (observers.has(observedObject)) {
    observations = observers.get(observedObject)!
  } else {
    observations = new Map()
    observers.set(observedObject, observations)
  }

  let computationContexts: Observation[]
  const observation: Observation = getObservation(computationContext)

  if (observations.has(field)) {
    computationContexts = observations.get(field)!
    if (!computationContexts.includes(observation)) {
      computationContexts.push(observation)
    }
  } else {
    computationContexts = [observation]
    observations.set(field, computationContexts)
  }
}

const notifyCycle = new Set<ComputationContext>()
export const notifyAll = (observedObject: object, field: any) => {
  // if notify cycle was empty when this was called it should be empty when it finishes
  const clearCycle = notifyCycle.size === 0

  // we need to notify all computation context observers that are still active
  // we also need to remove all non active observers that have been registered
  if (observers.has(observedObject)) {
    const observationMap: ObservationMap = observers.get(observedObject)!

    if (observationMap.has(field)) {
      const observations: Observation[] = observationMap.get(field)!

      for (let i = 0; i < observations.length; i++) {
        const observation: Observation = observations[i]
        const computationContext: ComputationContext | undefined = observation.computationCacheWeakRef.deref()

        if (
          computationContext !== undefined &&
          !notifyCycle.has(computationContext) &&
          computationContext.getRef() == observation.ref
        ) {
          notifyCycle.add(computationContext)
          computationContext.onInvalidate()
        }
      }
      observations.splice(0, observations.length)
    }
  }

  if (clearCycle) {
    notifyCycle.clear()
  }
}

const COMPUTATION_VALUE = 'value'
/**
 * Behaves as both the Computation and a Value, when it changes
 * it will notify all it's parents of the change.
 *
 * The notify is still linear in time even if the blocks propagation is true.
 */
export class Computation<T> implements ComputationContext {
  #ref = 1
  #lastCalcedRef = 0
  #calc
  #value: T | undefined

  constructor(calc: () => T) {
    this.#calc = calc
    this.onInvalidate = this.onInvalidate.bind(this)
  }
  get value(): T {
    if (this.#ref === this.#lastCalcedRef) {
      return this.#value!
    }
    registerComputationStart(this)
    try {
      this.#value = this.#calc()
    } catch (e) {
      registerComputationEnd(this)
      throw e
    }

    registerComputationEnd(this)
    this.#lastCalcedRef = this.#ref
    // we need to register the parent as the observer of the value
    observe(this, COMPUTATION_VALUE)

    return this.#value!
  }

  getRef() {
    return this.#ref
  }

  onInvalidate() {
    if (this.#ref === this.#lastCalcedRef) {
      this.#ref++
      // we need to notify all observers
      notifyAll(this, COMPUTATION_VALUE)
    }
  }
}

function useComputationState(): ComputationContext {
  const [ref, setRef] = useState(0)
  const getRef = useCallback(() => ref, [ref])
  const state = useMemo(() => {
    return {
      onInvalidate: () => setRef((r) => r + 1),
      getRef,
    }
  }, [setRef, getRef])
  return state
}

export function SmartComponent<T, M>(component: (props: M) => T): (props: M) => T {
  const InnerComponent = function (props: M): T {
    const state = useComputationState()

    registerComputationStart(state)
    const value: T = component(props)
    registerComputationEnd(state)
    return value
  }
  return InnerComponent
}

export function useSmartComputation<T>(computation: () => T): T {
  // will be notified when the computation value changes
  // this is how we will set state on the component
  const computationContext = useComputationState()
  const [computationState] = useState(() => new Computation(computation))

  registerComputationStart(computationContext)
  const value = computationState.value
  registerComputationEnd(computationContext)

  return value
}

export const SIMPLE_VAL_FIELD = 'val'
export class SimpleValue {
  #val

  constructor(val: number) {
    this.#val = val
  }

  set val(val: number) {
    this.#val = val
    notifyAll(this, SIMPLE_VAL_FIELD)
  }
  get val(): number {
    observe(this, SIMPLE_VAL_FIELD)
    return this.#val
  }
}
