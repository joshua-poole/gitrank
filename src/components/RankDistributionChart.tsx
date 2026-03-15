import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const rankColors: Record<string, string> = {
  UNRANKED: '#6b7280',
  PLASTIC: '#94a3b8',
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#00e5ff',
  DIAMOND: '#b9f2ff',
  LINUS: '#ff6b35',
}

// TODO: fetch from api
const chartData = [
  {
    rank: 'UNRANKED',
    label: 'U',
    name: 'Unranked',
    count: 89,
    fill: rankColors.UNRANKED,
  },
  {
    rank: 'PLASTIC_1',
    label: 'P1',
    name: 'Plastic 1',
    count: 142,
    fill: rankColors.PLASTIC,
  },
  {
    rank: 'PLASTIC_2',
    label: 'P2',
    name: 'Plastic 2',
    count: 198,
    fill: rankColors.PLASTIC,
  },
  {
    rank: 'PLASTIC_3',
    label: 'P3',
    name: 'Plastic 3',
    count: 234,
    fill: rankColors.PLASTIC,
  },
  {
    rank: 'BRONZE_1',
    label: 'B1',
    name: 'Bronze 1',
    count: 312,
    fill: rankColors.BRONZE,
  },
  {
    rank: 'BRONZE_2',
    label: 'B2',
    name: 'Bronze 2',
    count: 389,
    fill: rankColors.BRONZE,
  },
  {
    rank: 'BRONZE_3',
    label: 'B3',
    name: 'Bronze 3',
    count: 421,
    fill: rankColors.BRONZE,
  },
  {
    rank: 'SILVER_1',
    label: 'S1',
    name: 'Silver 1',
    count: 498,
    fill: rankColors.SILVER,
  },
  {
    rank: 'SILVER_2',
    label: 'S2',
    name: 'Silver 2',
    count: 543,
    fill: rankColors.SILVER,
  },
  {
    rank: 'SILVER_3',
    label: 'S3',
    name: 'Silver 3',
    count: 521,
    fill: rankColors.SILVER,
  },
  {
    rank: 'GOLD_1',
    label: 'G1',
    name: 'Gold 1',
    count: 467,
    fill: rankColors.GOLD,
  },
  {
    rank: 'GOLD_2',
    label: 'G2',
    name: 'Gold 2',
    count: 398,
    fill: rankColors.GOLD,
  },
  {
    rank: 'GOLD_3',
    label: 'G3',
    name: 'Gold 3',
    count: 312,
    fill: rankColors.GOLD,
  },
  {
    rank: 'PLATINUM_1',
    label: 'PL1',
    name: 'Platinum 1',
    count: 198,
    fill: rankColors.PLATINUM,
  },
  {
    rank: 'PLATINUM_2',
    label: 'PL2',
    name: 'Platinum 2',
    count: 134,
    fill: rankColors.PLATINUM,
  },
  {
    rank: 'PLATINUM_3',
    label: 'PL3',
    name: 'Platinum 3',
    count: 87,
    fill: rankColors.PLATINUM,
  },
  {
    rank: 'DIAMOND_1',
    label: 'D1',
    name: 'Diamond 1',
    count: 43,
    fill: rankColors.DIAMOND,
  },
  {
    rank: 'DIAMOND_2',
    label: 'D2',
    name: 'Diamond 2',
    count: 21,
    fill: rankColors.DIAMOND,
  },
  {
    rank: 'DIAMOND_3',
    label: 'D3',
    name: 'Diamond 3',
    count: 9,
    fill: rankColors.DIAMOND,
  },
  {
    rank: 'LINUS',
    label: 'Linus',
    name: 'Linus',
    count: 2,
    fill: rankColors.LINUS,
  },
]

const chartConfig = {
  count: {
    label: 'Players',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function RankDistributionChart() {
  return (
    <Card className="w-full sm:max-w-4/5">
      <CardHeader>
        <CardTitle className='font-bold'>Rank Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-100">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const { name, count } = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground">{count} players</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" activeBar={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
