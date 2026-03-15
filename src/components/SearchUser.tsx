import { SearchUserSchema } from '#/schemas'
import { useForm } from '@tanstack/react-form'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useTRPC } from '#/integrations/trpc/react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export function SearchUser() {
  const trpc = useTRPC()
  const router = useRouter()
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(
    null,
  )
  const [notFound, setNotFound] = useState(false)

  const query = useQuery({
    ...trpc.dashboard.searchUser.queryOptions({
      username: submittedUsername ?? '',
    }),
    enabled: !!submittedUsername,
    retry: false,
  })
  console.log({
    submittedUsername,
    status: query.status,
    data: query.data,
    error: query.error,
  })

  useEffect(() => {
    if (query.isSuccess) {
      router.navigate({
        to: '/dashboard/$username',
        params: { username: query.data.login },
      })
    }
    if (query.isError) {
      setNotFound(true)
      setSubmittedUsername(null)
    }
  }, [query.isSuccess, query.isError])

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
              <Field
                data-invalid={isInvalid}
                className="relative mb-2"
              >
                <FieldLabel className='pt-5' htmlFor={field.name}>Search</FieldLabel>
                <Input
                  className="text-sm h-10"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Github username"
                  autoComplete="off"
                />
                {notFound && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-500">
                    Github User Not Found
                  </p>
                )}
              </Field>
            )
          }}
        />
      </FieldGroup>
      <Button
        type="submit"
        form="search-user-form"
        className="text-sm h-10 mb-2"
      >
        Search
      </Button>
    </form>
  )
}
