import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './table'

it('renders correct HTML elements for full table structure', () => {
  const { container } = render(
    <Table>
      <TableCaption>Caption</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>hello</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
  expect(container.querySelector('table')).toBeTruthy()
  expect(container.querySelector('thead')).toBeTruthy()
  expect(container.querySelector('tbody')).toBeTruthy()
  expect(container.querySelector('tr')).toBeTruthy()
  expect(container.querySelector('th')).toBeTruthy()
  expect(container.querySelector('td')).toBeTruthy()
  expect(container.querySelector('caption')).toBeTruthy()
  expect(container.querySelector('td')!.textContent).toBe('hello')
})

it('TableHead renders a th element', () => {
  const { container } = render(<table><thead><tr><TableHead>Name</TableHead></tr></thead></table>)
  expect(container.querySelector('th')!.textContent).toBe('Name')
})

it('TableCell renders a td element', () => {
  const { container } = render(<table><tbody><tr><TableCell>Data</TableCell></tr></tbody></table>)
  expect(container.querySelector('td')!.textContent).toBe('Data')
})

it('TableRow has border-b class', () => {
  const { container } = render(<table><tbody><TableRow><td /></TableRow></tbody></table>)
  expect(container.querySelector('tr')!.className).toContain('border-b')
})
