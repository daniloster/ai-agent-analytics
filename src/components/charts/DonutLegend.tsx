export interface DonutLegendItem {
  color: string
  title: string
  renderDetail: () => React.ReactNode
}

export interface DonutLegendProps {
  items: DonutLegendItem[]
}

export function DonutLegend({ items }: DonutLegendProps): JSX.Element {
  return (
    <ul role="list" className="flex flex-col gap-3 flex-1 list-none p-0 m-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-[13px]">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{item.title}</span>
          <span className="text-muted-foreground ml-auto whitespace-nowrap">
            {item.renderDetail()}
          </span>
        </li>
      ))}
    </ul>
  )
}
