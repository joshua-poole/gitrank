import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-0">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">What GitHub data do you access?</AccordionTrigger>
        <AccordionContent className="text-base">
          The quick brown fox jumps over the lazy dog
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">When does the season reset?</AccordionTrigger>
        <AccordionContent className="text-base">
          The quick brown fox jumps over the lazy dog
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">How is my rank calculated?</AccordionTrigger>
        <AccordionContent className="text-base">
          The quick brown fox jumps over the lazy dog
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-2xl hover:text-primary hover:no-underline">Do I need to make an account?</AccordionTrigger>
        <AccordionContent className="text-base">
          The quick brown fox jumps over the lazy dog
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}