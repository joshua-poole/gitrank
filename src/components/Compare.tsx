
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
const users = [
  { name: 'imareeq', repos: 67, commits: 67, followers: 67, stars: 67, rank: 1, rr: 5500 },
  { name: 'joshkitten', repos: 67, commits: 67, followers: 67, stars: 67, rank: 2, rr: 4500 },
]
export default function Compare() {
  return (
    <main className="flex flex-row gap-2">
      {users.map(user => (
        <Card key={user.name} className="w-96"> 
          <CardHeader>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="text-primary">#{user.rank} - {user.rr} RR </CardDescription>
          </CardHeader>
          <CardContent className="text-base">
            <div className="flex justify-between items-center py-1">
              <span>Repos</span>
              <span>{user.repos}</span>
            </div>
              <hr className="my-2"/>
              <div className="flex justify-between items-center py-1">
                <span>Commits</span>
                <span>{user.commits}</span>
              </div>
              <hr className="my-2"/>
              <div className="flex justify-between items-center py-1">
                <span>Followers</span>
                <span>{user.followers}</span>
              </div>
              <hr className="my-2"/>
              <div className="flex justify-between items-center py-1">
                <span>Stars</span>
                <span>{user.stars}</span>
              </div>
          </CardContent>
          
        </Card>
      ))}
    </main>
  )
}