/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from 'vitest'

import { render } from '..'
import Comp from './fixtures/Comp.svelte'

describe('rerender', () => {
  test('mounts new component successfully', () => {
    const { container, rerender } = render(Comp, { props: { name: 'World 1' } })

    expect(container.firstChild).toHaveTextContent('Hello World 1!')
    rerender({ props: { name: 'World 2' } })
    expect(container.firstChild).toHaveTextContent('Hello World 2!')
  })

  test('destroys old component', () => {
    let isDestroyed

    const { rerender, component } = render(Comp, { props: { name: '' } })

    component.$$.on_destroy.push(() => {
      isDestroyed = true
    })
    rerender({ props: { name: '' } })
    expect(isDestroyed).toBeTruthy()
  })

  test('destroys old components on multiple rerenders', () => {
    const { rerender, queryByText } = render(Comp, { props: { name: 'Neil' } })

    rerender({ props: { name: 'Alex' } })
    expect(queryByText('Hello Neil!')).not.toBeInTheDocument()
    rerender({ props: { name: 'Geddy' } })
    expect(queryByText('Hello Alex!')).not.toBeInTheDocument()
  })
})
