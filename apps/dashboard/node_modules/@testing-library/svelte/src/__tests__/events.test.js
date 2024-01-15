import { describe, expect, test } from 'vitest'

import { fireEvent, render } from '..'
import Comp from './fixtures/Comp.svelte'

describe('events', () => {
  test('state changes are flushed after firing an event', async () => {
    const { getByText } = render(Comp, { props: { name: 'World' } })
    const button = getByText('Button')

    await fireEvent.click(button)

    expect(button).toHaveTextContent('Button Clicked')
  })

  test('calling `fireEvent` directly works too', async () => {
    const { getByText } = render(Comp, { props: { name: 'World' } })
    const button = getByText('Button')

    await fireEvent(
      button,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
    )

    expect(button).toHaveTextContent('Button Clicked')
  })
})
