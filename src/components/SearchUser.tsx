import { SearchUserSchema } from '#/schemas'
import { useForm } from '@tanstack/react-form'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Button } from './ui/button'

export function SearchUser() {
  const form = useForm({
    validators: {
      onSubmit: SearchUserSchema,
    },
    defaultValues: {
      username: '',
    },
    onSubmit: async ({ value }) => {
      // TODO: function call here
      console.log(`Searching for ${value.username}`)
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
