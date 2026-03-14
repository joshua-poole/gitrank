import { useRef } from 'react'
import { Separator } from './ui/separator'

export default function Footer() {
  const year = new Date().getFullYear()
  const textRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return
    const rect = textRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    textRef.current.style.setProperty('--x', `${x}px`)
    textRef.current.style.setProperty('--y', `${y}px`)
  }

  const handleMouseLeave = () => {
    if (!textRef.current) return
    textRef.current.style.setProperty('--x', '-100vw')
    textRef.current.style.setProperty('--y', '-100vw')
  }

  return (
    <footer className="w-full flex flex-col gap-0 items-center justify-center mt-20">
      <Separator />
      <div
        ref={textRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full flex text-[15vw] font-bold justify-center select-none text-primary"
        style={{
          maskImage:
            'radial-gradient(circle 20vw at var(--x, -100vw) var(--y, -100vw), black 0%, rgba(0,0,0,0.25) 100%)',
          WebkitMaskImage:
            'radial-gradient(circle 20vw at var(--x, -100vw) var(--y, -100vw), black 0%, rgba(0,0,0,0.25) 100%)',
        }}
      >
        GITRANK.XYZ
      </div>
      <div className="flex flex-col w-full gap-0 p-10 items-center justify-center">
        <p className="p-5 pb-2.5 text-sm m-0">
          &copy; {year} Claudius Maximus. All rights reserved.
        </p>
        <a
          href="https://github.com/joshua-poole/github-ranked"
          rel='noopener noreferrer'
          target='_blank'
          className="m-0 p-0 text-sm"
        >
          Source Code
        </a>
      </div>
    </footer>
  )
}
