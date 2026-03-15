import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import Compare from '#/components/Compare'
import { useState } from 'react'

export const Route = createFileRoute('/compare/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [user1, setUser1] = useState('')
  const [user2, setUser2] = useState('')
  const [trigger, setTrigger] = useState(0)

  return (
    <main className="flex flex-col items-center gap-4 page-wrap py-12">
      <h1>Side-by-Side Comparison of two users </h1>
      <div className="flex flex-row gap-4 ">
        <Input onChange={(e) => setUser1(e.target.value)} />
        vs
        <Input onChange={(e) => setUser2(e.target.value)} />
      </div>
      <Button
        onClick={() => {
          console.log('clicked', { user1, user2, trigger })
          setTrigger((t) => t + 1)
        }}
      >
        Compare
      </Button>
      <Compare user1={user1} user2={user2} trigger={trigger} />
    </main>
  )
}
