import type { LeaderboardColumn } from '#/schemas/leaderboard'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from './ui/card'
import { cn } from '#/lib/utils'
import { Link } from '@tanstack/react-router'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const columns: ColumnDef<LeaderboardColumn>[] = [
  {
    accessorKey: 'position',
    header: 'Position',
  },
  {
    accessorKey: 'username',
    header: 'Name',
  },
  {
    accessorKey: 'elo',
    header: 'Elo',
    cell: ({ getValue }) => (
      <div className="text-center">{String(getValue())}</div>
    ),
  },
  {
    accessorKey: 'commits',
    header: 'Commits',
    cell: ({ getValue }) => (
      <div className="text-right">{String(getValue())}</div>
    ),
  },
]

// TODO: Fetch from api
const data: LeaderboardColumn[] = [
  {
    username: 'joshkitten',
    position: 1,
    elo: 2400n,
    commits: 54,
  },
  {
    username: 'nathanielpookie',
    position: 2,
    elo: 2300n,
    commits: 50,
  },
  {
    username: 'friedchiggen',
    position: 3,
    elo: 2200n,
    commits: 47,
  },
  {
    username: 'andynextcoin',
    position: 4,
    elo: 2100n,
    commits: 45,
  },
  {
    username: 'aaroncpp',
    position: 5,
    elo: 2000n,
    commits: 40,
  },
  {
    username: 'goatreeq',
    position: 6,
    elo: 1800n,
    commits: 39,
  },
]

export function LeaderboardTable() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card className="overflow-hidden border flex w-full sm:max-w-4/5">
      <CardContent>
        <Table className="text-base">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.id === 'elo'
                        ? 'text-center'
                        : header.id === 'commits'
                          ? 'text-right'
                          : '',
                      'font-semibold text-xs text-muted-foreground',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <Link
                    to="/"
                    params={{ username: row.original.username }}
                    className="contents text-foreground!"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </Link>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No rankings yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
