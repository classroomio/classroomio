import { describe, expect, test } from 'vitest'

import { render } from '..'
import Comp from './fixtures/Comp.svelte'

describe('auto-cleanup', () => {
  // This just verifies that by importing STL in an
  // environment which supports afterEach (like jest)
  // we'll get automatic cleanup between tests.
  test('first', () => {
    render(Comp, { props: { name: 'world' } })
  })

  test('second', () => {
    expect(document.body.innerHTML).toEqual('')
  })
})

describe('cleanup of two components', () => {
  // This just verifies that by importing STL in an
  // environment which supports afterEach (like jest)
  // we'll get automatic cleanup between tests.
  test('first', () => {
    render(Comp, { props: { name: 'world' } })
    render(Comp, { props: { name: 'universe' } })
  })

  test('second', () => {
    expect(document.body.innerHTML).toEqual('')
  })
})
