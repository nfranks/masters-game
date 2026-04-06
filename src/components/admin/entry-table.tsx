'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';

interface EntryRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_name: string;
  is_paid: boolean;
  payment_method: string | null;
  paid_to: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
  total_points: number;
  is_archived: boolean;
  entry_golfers: { golfer: { name: string; group: { name: string } | null } }[];
}

interface Props {
  tournamentId: string;
  entries: EntryRow[];
  entryFee: number;
}

type SortField = 'team_name' | 'name' | 'email' | 'created_at' | 'updated_at';
type SortDir = 'asc' | 'desc';

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';
}

export function EntryTable({ entries: initialEntries, entryFee }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const activeEntries = entries.filter((e) => !e.is_archived);
  const archivedEntries = entries.filter((e) => e.is_archived);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = showArchived ? archivedEntries : activeEntries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.team_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'team_name': cmp = a.team_name.localeCompare(b.team_name); break;
        case 'name': cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`); break;
        case 'email': cmp = a.email.localeCompare(b.email); break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'updated_at': cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [activeEntries, archivedEntries, showArchived, search, sortField, sortDir]);

  const updateEntry = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } catch {
      toast.error('Failed to update entry');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Active Entries</p>
            <p className="text-2xl font-bold">{activeEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Archived</p>
            <p className="text-2xl font-bold text-gray-400">{archivedEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <Archive className="w-4 h-4 mr-2" />
          {showArchived ? `Archived (${archivedEntries.length})` : `${archivedEntries.length} Archived`}
        </Button>
      </div>

      <p className="text-sm text-gray-500">Showing {filtered.length} entries</p>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('team_name')}>
                    <span className="flex items-center">Team <SortIcon field="team_name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="flex items-center">Name <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('email')}>
                    <span className="flex items-center">Email <SortIcon field="email" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                    <span className="flex items-center">Submitted <SortIcon field="created_at" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('updated_at')}>
                    <span className="flex items-center">Last Updated <SortIcon field="updated_at" /></span>
                  </TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.team_name}</TableCell>
                    <TableCell>{entry.first_name} {entry.last_name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{entry.email}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {formatTimestamp(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {entry.updated_at !== entry.created_at
                        ? formatTimestamp(entry.updated_at)
                        : <span className="text-gray-300">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/entries/${entry.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit team">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={entry.is_archived ? 'Restore entry' : 'Archive entry'}
                          onClick={() => updateEntry(entry.id, { is_archived: !entry.is_archived })}
                        >
                          {entry.is_archived ? (
                            <ArchiveRestore className="w-3 h-3 text-green-600" />
                          ) : (
                            <Archive className="w-3 h-3 text-amber-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
