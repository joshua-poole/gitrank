import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full overflow-visible">
      <AccordionItem value="item-0">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">
          What GitHub data do you access?
        </AccordionTrigger>
        <AccordionContent className="text-base">
          GitRank only accesses public GitHub data - your repositories, commit
          history, stars, followers, and contribution activity. We never access
          private repositories or personal information beyond what is publicly
          visible on your profile.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">
          How is my rank calculated?
        </AccordionTrigger>
        <AccordionContent className="text-base">
          Your rank is calculated based on your GitHub activity. Commits, pull
          requests, issues, stars, consistency of contributions. The more you
          code the higher you climb.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">
          Do I need to make an account?
        </AccordionTrigger>
        <AccordionContent className="text-base">
          No. Just enter any GitHub username to view a profile and ranking. No
          sign up, no login required.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
