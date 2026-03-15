import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'

interface UserTagsProps {
  username: string
}

interface Tag {
  name: string
  color: 'red' | 'orange' | 'green'
}

const colorStyles: Record<Tag['color'], string> = {
  red: 'bg-red-300 text-red-900 border-4 border-red-500 font-black',
  orange: 'bg-orange-300 text-orange-900 border-4 border-orange-500 font-black',
  green: 'bg-green-300 text-green-900 border-4 border-green-500 font-black',
}

export function UserTags({ username }: UserTagsProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.getUserTags.queryOptions({ username }),
  )

  if (isLoading) return <div>Loading tags...</div>
  if (isError) return <div>Failed to load tags.</div>
  if (!data) return null

  const { tags, scores } = data

  if (!tags || tags.length === 0) return null

  const chartData = [
    { subject: 'Quality', value: scores.commit_score },
    { subject: 'Frequency', value: scores.commit_frequency },
    { subject: 'Consistency', value: scores.commit_consistency },
  ]

  return (
    <div className="flex gap-4">
      <Card className="border-[var(--line)] flex-1">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">Tags</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-0">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: Tag, index: number) => (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles[tag.color]}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--line)] flex-1">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">Scores</CardTitle>
        </CardHeader>
        <CardContent className="px-4 !pb-0">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar
                  dataKey="value"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}