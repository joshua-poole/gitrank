interface Tag {
  name: string
  color: 'red' | 'orange' | 'green'
}

export async function getTags(username: string): Promise<Tag[]> {
  return [
    {
      name: 'Clean commits',
      color: 'green',
    },
        {
      name: 'Crashes out',
      color: 'red',
    },
            {
      name: 'Fat chud',
      color: 'orange',
    },
  ]
}
