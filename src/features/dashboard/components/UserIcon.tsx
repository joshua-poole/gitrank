import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'

interface UserIconProps {
  username: string
  size?: number
}

export function UserIcon({ username, size = 64 }: UserIconProps) {
  const trpc = useTRPC()
  const {
    data: avatarUrl,
    isLoading,
    isError,
  } = useQuery(trpc.dashboard.getUserIcon.queryOptions({ username }))

  if (isLoading)
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-muted animate-pulse"
      />
    )

  if (isError)
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs"
      >
        ?
      </div>
    )

  return (
    <img
      src={avatarUrl}
      alt={`${username}'s GitHub avatar`}
      width={size}
      height={size}
			className="rounded-full ring-2 ring-primary shrink-0"
    />
  )
}
