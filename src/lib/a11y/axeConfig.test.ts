import { it, expect, afterEach } from 'vitest'
import { checkA11y } from './axeConfig'

afterEach(() => {
  document.body.innerHTML = ''
})

it('passes for a button with aria-label', async () => {
  const main = document.createElement('main')
  const btn = document.createElement('button')
  btn.setAttribute('aria-label', 'test')
  main.appendChild(btn)
  document.body.appendChild(main)
  await expect(checkA11y(document.body)).resolves.toBeUndefined()
})

it('throws for a button with no aria-label and no text content', async () => {
  const main = document.createElement('main')
  const btn = document.createElement('button')
  main.appendChild(btn)
  document.body.appendChild(main)
  await expect(checkA11y(document.body)).rejects.toThrow()
})

it('passes for an empty container with no interactive elements', async () => {
  const main = document.createElement('main')
  main.textContent = 'static content'
  document.body.appendChild(main)
  await expect(checkA11y(document.body)).resolves.toBeUndefined()
})
