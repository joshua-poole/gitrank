import { SearchUserSchema } from '#/schemas'
import { useForm } from '@tanstack/react-form'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useTRPC } from '#/integrations/trpc/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export function SearchUser() {
  const trpc = useTRPC()
  const router = useRouter()
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

    const { isFetching } = useQuery({
    ...trpc.dashboard.searchUser.queryOptions({ username: submittedUsername ?? '' }),
    enabled: !!submittedUsername,
    retry: false,
    onSuccess: ({ login }) => {
      router.navigate({ to: '/dashboard/$username', params: { username: login } })
    },
    onError: () => {
      setNotFound(true)
      setSubmittedUsername(null)
    },
  })

  const form = useForm({
    validators: {
      onSubmit: SearchUserSchema,
    },
    defaultValues: {
      username: '',
    },
    onSubmit: async ({ value }) => {
      setNotFound(false)
      setSubmittedUsername(value.username)
    },
  })

  return (
    <form
      id="search-user-form"
      className="flex flex-row w-full items-end justify-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="username"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid} >
                <FieldLabel htmlFor={field.name}>Search</FieldLabel>
                <Input
                  className='text-sm h-10'
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Github username"
                  autoComplete="off"
                />
              </Field>
            )
          }}
        />
      </FieldGroup>
      <Button type="submit" form="search-user-form" className='text-sm h-10'>
        Search
      </Button>
    </form>
  )
}
