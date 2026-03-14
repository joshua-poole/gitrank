import { createFileRoute } from '@tanstack/react-router'
import Faq from '#/components/Faq'

export const Route = createFileRoute('/about/')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    
    
      <main className="page-wrap px-4 py-12 flex flex-col items-center">  
        <section className="island-shell rounded-2xl p-6 sm:p-8 mt-8 w-full max-w-3xl">
          <p className="island-kicker mb-4">FAQ</p>
          <Faq />
        </section>
        <section className="island-shell rounded-2xl p-6 sm:p-8 w-full max-w-3xl">
          <p className="island-kicker mb-2">About</p>
          <h1 className="display-title mb-3 text-4xl font-bold text-primary sm:text-5xl">
            Make coding feel like a game
          </h1>
          <div className="island-description text-lg  space-y-4 mb-10">
            <p>GitRank turns your GitHub activity into a global ranking. We built it to make coding more engaging, especially for developers just starting out.</p>
            <p>Every commit, every repo, every contribution adds to your score and puts you on the board alongside developers from around the world.</p>
            <p>Coding in isolation gets old fast. GitRank gives your work visibility. It rewards consistency, encourages you to build in public, and creates the kind of friendly competition that actually makes you better.</p>
          </div>

          <h1 className="display-title mb-3 text-4xl font-bold text-primary sm:text-5xl">
            Commits don't lie
          </h1>
          <div className="island-description text-lg space-y-4">
            <p>GitRank tracks more than just your output, it tracks your patterns. Late night commits, weekend deploys, panic fixes at 2am. We surface these habits not to shame you, but because most developers don't realise how their working patterns look until they see them laid out.</p>
            <p>Burnout isn't a flex. The best developers aren't the ones who work the most hours, they're the ones who work sustainably. 
              GitRank is built to help you be that developer.</p>
            <p>Work smarter, not harder.</p>
          </div>
        </section>

      
    </main>
    
  )
}

/*
when season ends/starts
how elo is calculated
*/