import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEffect, useState } from 'react'

const HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
}

async function fetchUser(username: string) {
  const [profile, repos, commits] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, {
      headers: HEADERS,
    }).then((r) => r.json()),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: HEADERS,
    }).then((r) => r.json()),
    fetch(`https://api.github.com/search/commits?q=author:${username}`, {
      headers: {
        ...HEADERS,
        Accept: 'application/vnd.github.cloak-preview+json',
      },
    }).then((r) => r.json()),
  ])

  return {
    name: profile.login,
    avatar: profile.avatar_url,
    repos: profile.public_repos,
    followers: profile.followers,
    stars: repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0),
    commits: commits.total_count,
  }
}
export default function Compare({
  user1,
  user2,
  trigger,
}: {
  user1: string
  user2: string
  trigger: number
}) {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!user1 || !user2) return
    Promise.all([fetchUser(user1), fetchUser(user2)]).then(setUsers)
  }, [trigger])

  return (
    <main className="flex flex-row gap-2">
      {users.map((user) => (
        <Card key={user.name} className="w-96">
          <CardHeader>
            <img src={user.avatar} className="w-12 h-12 rounded-full mb-2" />
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="text-primary">
              #{user.rank} - {user.rr} RR{' '}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base">
            <div className="flex justify-between items-center py-1">
              <span>Repos</span>
              <span>{user.repos}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center py-1">
              <span>Commits</span>
              <span>{user.commits}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center py-1">
              <span>Followers</span>
              <span>{user.followers}</span>
            </div>
            <hr className="my-2" />
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
