import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rank/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/rank/"!</div>
}
