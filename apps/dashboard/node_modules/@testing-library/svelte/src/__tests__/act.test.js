import { beforeEach, describe, expect, test } from 'vitest'

import { act, fireEvent, render as stlRender } from '..'
import Comp from './fixtures/Comp.svelte'

describe('act', () => {
  let props

  const render = () => {
    return stlRender(Comp, {
      props
    })
  }

  beforeEach(() => {
    props = {
      name: 'World'
    }
  })

  test('state updates are flushed', async () => {
    const { getByText } = render()
    const button = getByText('Button')

    expect(button).toHaveTextContent('Button')

    await act(() => {
      button.click()
    })

    expect(button).toHaveTextContent('Button Clicked')
  })

  test('findByTestId returns the element', async () => {
    const { findByTestId } = render()

    expect(await findByTestId('test')).toHaveTextContent(`Hello ${props.name}!`)
  })

  test('accepts async functions', async () => {
    const sleep = (ms) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
      })

    const { getByText } = render()
    const button = getByText('Button')

    await act(async () => {
      await sleep(100)
      await fireEvent.click(button)
    })

    expect(button).toHaveTextContent('Button Clicked')
  })
})
