## Inspiration

Every developer has a GitHub profile, but right now it's just noise. 📊 Recruiters spend an average of 6 seconds per applicant, and in that time a wall of green squares and repo names tells them almost nothing. We thought there had to be a better way. 🤔

We've all been there. You're mass applying for jobs and wondering how anyone is supposed to tell what makes you different from the next dev with 50 repos and a "passionate about clean code" bio. Meanwhile, recruiters and hiring managers are drowning in profiles they can't meaningfully compare. The current state of GitHub profiles just doesn't work for anyone:

- Developers have no way to showcase the quality of their work, only the quantity.
- Recruiters can't meaningfully compare candidates without diving deep into individual repos.
- There's no incentive to write better commit messages, maintain sustainable work patterns, or improve as a developer beyond just shipping more code.

That's when we asked ourselves, what if GitHub profiles actually meant something? What if there was a number, a rank, a tier that instantly told you how someone codes? Not just how much, but how well. 💡

And beyond hiring, we just love the idea of making coding competitive. 🏆 Some of us are gamers, and the dopamine hit of ranking up in League of Legends or chess is real. What if we could bring that same energy to software development? Friendly banter, rivalries, bragging rights. Your commit history shouldn't just sit there, it should be your highlight reel. 🎮

That's how GitRank was born. A ranking system that turns your GitHub activity into a competitive profile that recruiters can actually use and developers can actually have fun with. Because coding doesn't have to be a solo grind. 💪

## What it does

Our purpose boils down to three core goals:

**Analytics** 📈 — We extend GitHub by surfacing insights it never built. Contribution patterns, commit quality scores, and a detailed dashboard that gives you (and anyone looking at your profile) a clear picture of how you work.

**Ranking** 🏅 — Every developer gets an Elo rating and a competitive tier, from Plastic all the way up through Bronze, Silver, Gold, Platinum, and Diamond to the legendary Linus rank. Each tier has three subdivisions (III, II, I), giving you 20 distinct levels to climb. Think League of Legends, but for your GitHub.

**Competition** ⚔️ — A global seasonal leaderboard ranks all tracked developers, and a head-to-head compare page lets you pit your profile against a friend's. Settle debates with real stats, not opinions.

How do we stand out? We're not just counting commits. Our ML model actually reads your commit messages and scores them on quality. Writing "fix" gets you a very different score than writing "fix: resolve race condition in auth middleware". We reward developers who communicate well, work sustainable hours, and maintain consistent pacing, not just the ones who push the most code. 🧠

## How we built it

We first focused on getting the scaffold up as fast as possible, choosing TanStack Start as our full-stack React framework for file-based routing, server functions, and SSR out of the box. From there we split into sub-teams. One sub-team worked on the frontend dashboard and UI components, one sub-team tackled the ML pipeline and scoring algorithm, and one sub-team handled the backend, database, and deployment. We kept a shared task board and communicated constantly to make sure everything would integrate cleanly. ⚡

**Frontend:**

- Built with React 19 and TypeScript for a modern, type-safe codebase.
- Styled using Tailwind CSS and enhanced with Shadcn UI components.
- Used Recharts for data visualisation including contribution graphs and rank distribution charts.
- tRPC for end-to-end type-safe API calls between client and server, no REST schemas to maintain.
- Full light/dark/auto theme support with a custom theme toggle. 🌙

**Backend:**

- tRPC server with service-layer architecture for clean separation of concerns.
- Prisma ORM with PostgreSQL (Neon serverless) for the database layer.
- Schema models users, seasonal leaderboards, badges, and challenges.
- GitHub REST and GraphQL APIs for fetching user data, repos, and contribution history.
- Deployed on Vercel with serverless functions. ☁️

**ML Pipeline:**

- Sentence-transformer (all-MiniLM-L6-v2) as the embedder, encoding commit messages into 384-dimensional vectors.
- Started with a raw dataset of 4.3 million unorganised commit messages from Kaggle.
- Used FAISS (Facebook AI Similarity Search) to index and efficiently search through the embeddings.
- Constructed a labelled signal set by combining examples from Joel Parker Henderson's git commit message guide, the Conventional Commits specification, and hand-written samples of good and bad messages. This gave us a positive/negative split that we used to retrieve nearest neighbours from the 4.3M pool. 📚
- Trained a logistic regression classifier (scikit-learn) on the retrieved samples. Binary classification returning probabilities from 0 to 1, where 0 is a low-quality commit and 1 is a clean, conventional one.
- Currently using ONNX Runtime and Optimum to serve the model without relying on PyTorch, keeping the deployment footprint smaller. 📦
- Served via a FastAPI microservice that loads the model on startup and scores commits on demand.

**Elo Algorithm:**

- Scores commits on five weighted factors: ML-analysed message quality (30%), lines of code changed (35%), consistency of commit pacing (10%), time of day (15%), and day of week (10%).
- Commits during regular working hours and on weekdays score higher, reflecting sustainable development patterns.
- A time decay of 0.99 per day ensures recent activity matters most, with only the last 90 days considered.
- The raw score feeds into an MMR system where daily performance is compared against an expected value based on current rating. Maximum 100 MMR gain per day, with a 15 MMR penalty for inactive days. ⚖️

## Challenges we ran into

The biggest challenge we faced was integration, and it hit us on multiple levels. 😤

Getting the Prisma ORM working with Neon's serverless PostgreSQL adapter on Vercel was a recurring headache. The production database schema kept falling out of sync with our Prisma schema, leading to cryptic "column not available" errors that gave us no useful stack trace. We spent a lot of time debugging what turned out to be a simple schema push issue, but the error messages made it feel like something much deeper was broken. Different team members were making schema changes in parallel, and keeping the database, the Prisma client, and the deployed version all in sync required constant communication.

The ML model size was another major blocker. 🧱 Our sentence-transformer and its dependencies come in at around 2GB, which is well beyond Vercel's 250MB serverless function limit. This forced us to run the ML scoring service on a separate platform entirely, which introduced additional hosting costs, latency between services, and deployment complexity. We eventually migrated from PyTorch to ONNX Runtime to reduce the footprint, but it was still too large for Vercel. Hosting ML externally on a hackathon budget meant thinking carefully about how to handle concurrent requests without costs spiralling.

GitHub's API rate limits were a constant constraint throughout development. 🚦 The REST API caps authenticated requests at 5,000 per hour, and the GraphQL API has its own point-based limiting system. Since a single user lookup can consume dozens of API calls across repos and commit history, we hit rate limits repeatedly during demos and testing. We had to implement caching and batch our requests carefully to stay within limits. There were a few tense moments during live demos where we weren't sure if the next search would work or if we'd burned through our quota. 😅

Tuning the Elo algorithm itself was harder than expected. 🎯 Our first few iterations just rewarded volume, so the dev who pushed 200 one-line commits ranked higher than someone writing thoughtful, well-structured code. Getting the weights, decay rates, and scoring factors balanced so that rankings actually felt meaningful took a lot of trial and error. We went through dozens of iterations, testing against our own GitHub histories and adjusting until the results felt fair.

We also found that integrating different learning resources and libraries was its own challenge. We were combining tRPC, Prisma, Neon, FAISS, sentence-transformers, FastAPI, and Vercel, each with their own conventions and quirks. Making each work individually was one thing, but getting them all to talk to each other properly was another thing entirely. In a few cases we had to build custom solutions because the existing integrations didn't behave the way we expected.

## Accomplishments that we're proud of

We built a full end-to-end pipeline from raw GitHub data to a live competitive ranking in a single hackathon, and we're genuinely proud of that. 🎉

The ML sentiment model works surprisingly well at distinguishing meaningful commit messages from low-quality ones. Seeing it correctly score "fix" as low and "fix: resolve null pointer in user authentication flow" as high was a satisfying moment. We trained it on 4.3 million commit messages and the classifier generalises well to messages it's never seen before. 🤩

Our Elo system produces rankings that genuinely reflect development quality over quantity. We tested it against our own GitHub histories and the rankings felt fair, which was the whole goal. The fact that we could look at the output and say "yeah, that actually makes sense" after all the tuning was really rewarding. ✅

We're also proud of the dashboard and contribution visualisations that make the data feel tangible, and the gamification elements that make it genuinely fun to check your rank and compare with friends. The moment we first saw our ranks appear on screen, the competitive trash talk started immediately. That's exactly what we wanted. 😂

And of course, we're proud of our teamwork. We had people working on frontend, backend, ML, and design simultaneously, and having everything come together as a cohesive product was really satisfying. We communicated constantly, celebrated wins along the way, and pulled through the inevitable 2am debugging sessions together. 💪

## What we learned

This project taught us a lot, both technically and as a team. 🌉

**Bridging Two Tech Stacks**
Integrating a Python ML microservice with a TypeScript full-stack app meant dealing with serialisation, deployment, and latency challenges we hadn't faced before. We learned that the gap between "it works locally" and "it works in production" is much wider than you'd think, especially when your services are in different languages on different platforms.

**ML Isn't Magic**
On the ML side, we learned how sentence-transformer embeddings can be leveraged for classification tasks beyond just similarity search, and that FAISS is incredibly powerful for organising and searching through millions of data points efficiently. We also learned the hard way that a 2GB model doesn't fit in a serverless function. 😅

**Fairness Is Hard**
Tuning a ranking system to feel "fair" is more art than science. The math is straightforward, but getting humans to look at the output and say "yeah, that feels right" required dozens of iterations on weights and parameters. We gained a new appreciation for how much thought goes into ranking systems in games.

**AI Is a Tool, Not a Solution**
Whilst LLMs helped us with explaining new tools and brainstorming approaches, we quickly learned they weren't a magic solution. As our codebase grew in complexity, AI suggestions became less accurate and sometimes pointed us in the wrong direction entirely. We found AI was most effective for learning and prototyping, not as a replacement for understanding the code ourselves.

**Speed and Communication**
Working in a hackathon is a different beast to our usual development process. We learned to prioritise speed and communication, keep a shared task board, celebrate small wins to keep morale up, and not get too attached to a single approach. When something wasn't working, we pivoted fast instead of sinking more time into it.

## What's next for GitRank: GitHub Ranked

We're just getting started. 🚀

First, we want to implement the badge and challenge system that's already modelled in our database, giving developers goals to work towards beyond just climbing the leaderboard. Imagine earning a "Night Owl" badge for consistent late-night commits or an "Open Source Hero" badge for contributing to public repos. 🏅

We plan to flesh out the compare page into a full head-to-head experience, with detailed stat breakdowns and visual comparisons. We also want to add seasonal resets with historical tracking, so you can see how your rank has changed over time. 📈

On the ML side, we want to experiment with more sophisticated models and incorporate additional signals like PR review quality, issue triage patterns, and code review responsiveness. The more data points we have, the more meaningful the rankings become. 🧠

We're also exploring ways to make the platform useful beyond just friendly competition. Imagine a recruiter dashboard where hiring managers can search and filter developers by rank, language, and contribution patterns. That's the long-term vision: making GitRank the analytics layer that GitHub never built. 💼

Because at the end of the day, your code speaks for itself. We're just giving it a scoreboard. 🎮

## Built With

- React 19
- TypeScript
- TanStack Start / TanStack Router
- Tailwind CSS
- Shadcn UI
- tRPC
- Prisma
- Neon PostgreSQL
- Recharts
- Python
- FastAPI
- scikit-learn
- FAISS
- ONNX Runtime
- Optimum
- Sentence-Transformers (all-MiniLM-L6-v2)
- Vercel
