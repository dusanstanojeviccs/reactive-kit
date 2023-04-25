import Demo from './components/App'

import {
  ComputationContext,
  observers,
  observe,
  notifyAll,
  Computation,
  SmartComponent,
  useSmartComputation,
  SIMPLE_VAL_FIELD,
  SimpleValue,
} from './core'

import { getFastState } from './fast_state_proxies'

export {
  Demo,
  ComputationContext,
  observers,
  observe,
  notifyAll,
  Computation,
  SmartComponent,
  useSmartComputation,
  SIMPLE_VAL_FIELD,
  SimpleValue,
  getFastState,
}
