import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about/')({
  component: RouteComponent,
})



function RouteComponent() {
  return (
    
    
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-(--sea-ink) sm:text-5xl">
          Make coding feel like a game
        </h1>
        <p className="island-description text-lg text-[#a8b1bb]">
          GitRank turns your GitHub activity into a global ranking. 
          We built it to make coding more engaging — especially for 
          developers just starting out. Every commit, every repo, every 
          contribution adds to your score and puts you on the board 
          alongside developers from around the world. Coding in isolation gets old fast. 
          GitRank gives your work visibility. It rewards consistency, 
          encourages you to build in public, and creates the kind of friendly competition 
          that actually makes you better. Whether you're a student pushing your first project 
          or a developer with years of commits behind you, there's a place for everyone on the leaderboard.
        </p>
        <br />
        <h1 className="display-title mb-3 text-4xl font-bold text-(--sea-ink) sm:text-5xl">
          Commits don't lie
        </h1>
        <p className="island-description text-lg text-[#a8b1bb]">
          GitRank also tracks more than just your output — it tracks your patterns. 
          Late night commits, weekend deploys, panic fixes at 2am. 
          We surface these habits not to shame you, but because most developers 
          don't realise how their working patterns look until they see them laid out.
          Burnout isn't a flex. The best developers aren't the ones who work 
          the most hours, they're the ones who work sustainably. 
          GitRank is built to help you be that developer. 
        </p>
        <p className="island-description text-lg text-[#a8b1bb]">Work smarter, not harder.</p>
      </section>
    </main>
    
  )
}

//make card component, add to home page.