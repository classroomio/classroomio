import { describe, expect, test, vi } from 'vitest'

import { act, fireEvent, render } from '..'
import Stopwatch from './fixtures/Stopwatch.svelte'

describe('unmount', () => {
  test('unmounts component successfully', async () => {
    console.warn = vi.fn()

    const { unmount, getByText, container } = render(Stopwatch)

    await fireEvent.click(getByText('Start'))

    unmount()

    // Hey there reader! You don't need to have an assertion like this one
    // this is just me making sure that the unmount function works.
    // You don't need to do this in your apps. Just rely on the fact that this works.
    expect(container.innerHTML).toBe('<div></div>')

    await act()
    expect(console.warn).not.toHaveBeenCalled()
  })

  test('destroying component directly and calling unmount does not log warning', async () => {
    console.warn = vi.fn()

    const { unmount, component } = render(Stopwatch)

    component.$destroy()
    unmount()

    expect(console.warn).not.toHaveBeenCalled()
  })
})
