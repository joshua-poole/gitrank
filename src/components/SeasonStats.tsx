import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { Item } from './ui/item'
import { CalendarDays, GitCommitHorizontal, Globe } from 'lucide-react'

export function SeasonStats() {
  // TODO: Change to API call
  const seasonStats = [
    {
      Icon: CalendarDays,
      title: 'Season Ends',
      value: '25d 02h',
    },
    {
      Icon: Globe,
      title: 'Tracked Coders',
      value: '1,200',
    },
    {
      Icon: GitCommitHorizontal,
      title: 'Commits Analysed',
      value: '4.2M',
    },
  ]

  return (
    <Card className="w-full sm:max-w-3/4 md:max-w-1/2">
      <CardContent className="w-full flex flex-row justify-around gap-2.5">
        {seasonStats.map((stat, index) => (
          <Item className="flex flex-1 items-center justify-center" variant="muted"  key={stat.title}>
            <div
              className="flex flex-row items-center justify-center gap-1"
            >
              <stat.Icon className="size-10" />
              <div className="flex flex-col gap-0">
                <h2 className="text-xs font-light">{stat.title}</h2>
                <p className="text-base text-primary font-semibold">{stat.value}</p>
              </div>
            </div>
            {index < seasonStats.length - 1 && (
              <Separator
                orientation="vertical"
                className="h-10 mx-2"
              />
            )}
          </Item>
        ))}
      </CardContent>
    </Card>
  )
}
