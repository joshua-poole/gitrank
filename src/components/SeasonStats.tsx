import { CalendarDotsIcon, GlobeIcon } from '@phosphor-icons/react'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { Fragment } from 'react/jsx-runtime'

export function SeasonStats() {
  // TODO: Change to API call
  const seasonStats = [
    {
      Icon: CalendarDotsIcon,
      title: 'Season Ends',
      value: '25d 02h',
    },
    {
      Icon: GlobeIcon,
      title: 'Tracked Coders',
      value: '1,200',
    },
  ]

  return (
    <Card className="w-full sm:max-w-3/4 md:max-w-1/2">
      <CardContent className="w-full flex flex-row justify-around">
        {seasonStats.map((stat, index) => (
          <Fragment key={stat.title}>
            <div
              className="flex flex-row items-center justify-center gap-1"
            >
              <stat.Icon className="size-10" />
              <div className="flex flex-col gap-0">
                <h2 className="text-xs font-light">{stat.title}</h2>
                <p className="text-base font-semibold">{stat.value}</p>
              </div>
            </div>
            {index < seasonStats.length - 1 && (
              <Separator
                orientation="vertical"
                className="h-10 mx-2"
              />
            )}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  )
}
