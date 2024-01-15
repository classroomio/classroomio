<svelte:options accessors />

<script>
  import { getContext } from 'svelte'

  export let name

  let buttonText = 'Button'

  const contextName = getContext('name')

  function handleClick () {
    buttonText = 'Button Clicked'
  }
</script>

<h1 data-testid="test">Hello {name}!</h1>

<div>we have {contextName}</div>

<button on:click={handleClick}>{buttonText}</button>

<style></style>
