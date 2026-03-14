import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import Compare from '#/components/Compare'

export const Route = createFileRoute('/duel/')({
  component: RouteComponent,
})

function RouteComponent() { 
    return (
        <main className="flex flex-col items-center gap-8 py-12">
            <div className="flex flex-row gap-4 ">
                <Input /> 
                    vs 
                <Input />
            </div>
            <Button>Compare</Button>
            <Compare />
        </main>
    )
}

