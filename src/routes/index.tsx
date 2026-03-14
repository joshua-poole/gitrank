import { SearchUser } from '#/components/SearchUser'
import { SeasonStats } from '#/components/SeasonStats'
import { TopRanked } from '#/components/TopRanked'
import { Card, CardContent } from '#/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="w-full flex flex-col page-wrap px-4 pb-8 pt-14 gap-10 justify-center items-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">GitRank.GG: Ranked Github Stats.</h1>
        <p>
          Detailed commit statistics and global GitRank.GG rankings for the
          modern developer.
        </p>
      </div>
      <div className='flex flex-col w-full items-center justify-center gap-5'>
        <Card className="w-full sm:max-w-3/4 md:max-w-1/2">
          <CardContent>
            <SearchUser />
          </CardContent>
        </Card>
        <SeasonStats />
        <TopRanked />
      </div>
    </main>
  )
}
