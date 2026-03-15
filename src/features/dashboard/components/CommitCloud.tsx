import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import Wordcloud from '@visx/wordcloud/lib/Wordcloud'
import { Text } from '@visx/text'
import { useRef, useState, useEffect } from 'react'

interface WordCloudProps {
  username: string
}

interface Datum {
  text: string
  value: number
}

const ROTATIONS = [0, 0, 0, 90, -90]

export function CommitCloud({ username }: WordCloudProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError, error } = useQuery(
    trpc.dashboard.getCommitMessages.queryOptions({ username }),
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (isLoading) return <div>Loading word cloud...</div>
  if (isError)
    return <div>Failed to load word cloud: {JSON.stringify(error)}</div>
  if (!data || data.length === 0) return null

  const words = data as unknown as Datum[]
  const maxValue = Math.max(...words.map((w) => w.value))
  const minValue = Math.min(...words.map((w) => w.value))

  function getOpacity(value: number) {
    if (maxValue === minValue) return 1
    return 0.35 + ((value - minValue) / (maxValue - minValue)) * 0.65
  }

  return (
    <Card className="border-[var(--line)]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm">Commit vocabulary</CardTitle>
      </CardHeader>
      <CardContent className="px-4 !pb-0">
        <div ref={containerRef} className="h-64">
          <Wordcloud
            words={words}
            width={width}
            height={256}
            fontSize={(d) => Math.log2(d.value) * 10}
            rotate={() => ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)]}
            padding={4}
            font="sans-serif"
          >
            {(cloudWords) =>
              cloudWords.map((w) => {
                const original = words.find((d) => d.text === w.text)
                const opacity = original ? getOpacity(original.value) : 0.5
                return (
                  <Text
                    key={w.text}
                    fill="var(--primary)"
                    fillOpacity={opacity}
                    textAnchor="middle"
                    transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                    fontSize={w.size}
                    fontFamily={w.font}
                  >
                    {w.text}
                  </Text>
                )
              })
            }
          </Wordcloud>
        </div>
      </CardContent>
    </Card>
  )
}
