import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '#/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface ContributionGraphProps {
  username: string
}

const chartConfig = {
  count: {
    label: 'Commits',
    color: 'var(--lagoon)',
  },
} satisfies ChartConfig

export function ContributionGraph({ username }: ContributionGraphProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.getContributions.queryOptions({ username }),
  )

  if (isLoading) return <div>Loading contributions...</div>
  if (isError) return <div>Failed to load contributions.</div>
  if (!data) return null

  return (
    <Card className="border-[var(--line)]]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm]">Contributions — last 90 days</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 0, left: 17, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'var(--sea-ink-soft)', fontSize: 11 }}
              tickFormatter={(val) =>
                new Date(val).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              interval={13}
            />
            <YAxis hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(val) =>
                    new Date(val).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-count)"
              fill="var(--color-count)"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
