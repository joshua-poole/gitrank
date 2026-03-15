import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Compare', path: '/compare' },
  { label: 'About', path: '/About' },
]

export default function Header() {
  return (
    <header className="w-full flex flex-row items-center justify-between p-5">
      <NavigationMenu className="gap-5">
        <Link to="/"><img src='/gitrank-logo.svg' className='size-17.5 ml-5'/></Link>
        <NavigationMenuList>
          {navItems.map((el) => (
            <NavigationMenuItem key={el.label}>
              <NavigationMenuLink asChild className='text-sm'>
                <Link to={el.path}>{el.label}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </header>
  )
}
