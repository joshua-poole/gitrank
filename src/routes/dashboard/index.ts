import { DashboardPage } from '#/features/dashboard/DashboardPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})
