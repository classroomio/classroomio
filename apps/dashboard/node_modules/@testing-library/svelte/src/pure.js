import {
  fireEvent as dtlFireEvent,
  getQueriesForElement,
  prettyDOM
} from '@testing-library/dom'
import { tick } from 'svelte'

const containerCache = new Set()
const componentCache = new Set()

const svelteComponentOptions = [
  'accessors',
  'anchor',
  'props',
  'hydrate',
  'intro',
  'context'
]

const render = (
  Component,
  { target, ...options } = {},
  { container, queries } = {}
) => {
  container = container || document.body
  target = target || container.appendChild(document.createElement('div'))

  const ComponentConstructor = Component.default || Component

  const checkProps = (options) => {
    const isProps = !Object.keys(options).some((option) =>
      svelteComponentOptions.includes(option)
    )

    // Check if any props and Svelte options were accidentally mixed.
    if (!isProps) {
      const unrecognizedOptions = Object.keys(options).filter(
        (option) => !svelteComponentOptions.includes(option)
      )

      if (unrecognizedOptions.length > 0) {
        throw Error(`
          Unknown options were found [${unrecognizedOptions}]. This might happen if you've mixed
          passing in props with Svelte options into the render function. Valid Svelte options
          are [${svelteComponentOptions}]. You can either change the prop names, or pass in your
          props for that component via the \`props\` option.\n\n
          Eg: const { /** Results **/ } = render(MyComponent, { props: { /** props here **/ } })\n\n
        `)
      }

      return options
    }

    return { props: options }
  }

  let component = new ComponentConstructor({
    target,
    ...checkProps(options)
  })

  containerCache.add({ container, target, component })
  componentCache.add(component)

  component.$$.on_destroy.push(() => {
    componentCache.delete(component)
  })

  return {
    container,
    component,
    debug: (el = container) => console.log(prettyDOM(el)),
    rerender: (options) => {
      if (componentCache.has(component)) component.$destroy()

      // eslint-disable-next-line no-new
      component = new ComponentConstructor({
        target,
        ...checkProps(options)
      })

      containerCache.add({ container, target, component })
      componentCache.add(component)

      component.$$.on_destroy.push(() => {
        componentCache.delete(component)
      })
    },
    unmount: () => {
      if (componentCache.has(component)) component.$destroy()
    },
    ...getQueriesForElement(container, queries)
  }
}

const cleanupAtContainer = (cached) => {
  const { target, component } = cached

  if (componentCache.has(component)) component.$destroy()

  if (target.parentNode === document.body) {
    document.body.removeChild(target)
  }

  containerCache.delete(cached)
}

const cleanup = () => {
  Array.from(containerCache.keys()).forEach(cleanupAtContainer)
}

const act = (fn) => {
  const value = fn && fn()
  if (value !== undefined && typeof value.then === 'function') {
    return value.then(() => tick())
  }
  return tick()
}

const fireEvent = async (...args) => {
  const event = dtlFireEvent(...args)
  await tick()
  return event
}

Object.keys(dtlFireEvent).forEach((key) => {
  fireEvent[key] = async (...args) => {
    const event = dtlFireEvent[key](...args)
    await tick()
    return event
  }
})

/* eslint-disable import/export */

export * from '@testing-library/dom'

export { render, cleanup, fireEvent, act }
