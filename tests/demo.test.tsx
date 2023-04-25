import * as React from 'react'
import { render } from '@testing-library/react'

import 'jest-canvas-mock'

import { Demo } from '../src'

describe('Rendering Demo', () => {
  it('renders demo crashing', () => {
    render(<Demo value={10} />)
  })
})
