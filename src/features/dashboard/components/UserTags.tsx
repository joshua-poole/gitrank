import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

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
  if (!data || data.length === 0) return null

  return (
    <Card className="border-[var(--line)]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm">Tags</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {data.map((tag: Tag, index: number) => (
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
  )
}
