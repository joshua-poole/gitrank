import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Link } from '@tanstack/react-router'
import { Separator } from './ui/separator'

export function TopRanked() {
  // TODO: Replace with api call
  const topRanked = [
    {
      name: 'joshkitten',
      rank: 1,
      elo: 5300,
    },
    {
      name: 'joshkitten',
      rank: 2,
      elo: 5240,
    },
    {
      name: 'joshkitten',
      rank: 3,
      elo: 5100,
    },
  ]

  return (
    <Card className="w-full sm:max-w-3/4 md:max-w-1/2">
      <CardHeader>
        <CardTitle>Top Ranked this Season</CardTitle>
      </CardHeader>
      <CardContent>
        {topRanked.map((el, index) => (
          <div key={el.name + index}>
            <Button
              variant="ghost"
              asChild
              className="flex h-auto w-full flex-row items-center justify-center gap-2.5 rounded-none px-3 py-2.5"
            >
              <Link to="/rank">
                <img
                  className="h-12 rounded-full aspect-square"
                  src={`https://github.com/imareeq.png`}
                  alt={`${el.name} profile picture`}
                />
                <span className="flex flex-col gap-1 flex-1 text-left">
                  <p className="text-base font-semibold text-foreground">{el.name}</p>
                  <p className="text-chart-1">{el.elo} RR</p>
                </span>
                <p className="ml-auto text-lg font-bold text-foreground">#{el.rank}</p>
              </Link>
            </Button>
            {index < topRanked.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
