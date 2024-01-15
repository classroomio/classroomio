import { prettyDOM } from '@testing-library/dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { render } from '..'
import Comp from './fixtures/Comp.svelte'

describe('debug', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('pretty prints the container', () => {
    const { container, debug } = render(Comp, { props: { name: 'world' } })

    debug()

    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(prettyDOM(container))
  })
})
