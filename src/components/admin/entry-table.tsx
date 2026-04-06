'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  total_points: number;
  entry_golfers: { golfer: { name: string; group: { name: string } | null } }[];
}

interface Props {
  tournamentId: string;
  entries: EntryRow[];
  entryFee: number;
}

type SortField = 'team_name' | 'name' | 'paid_to' | 'payment_method' | 'is_paid' | 'created_at';
type SortDir = 'asc' | 'desc';

export function EntryTable({ entries: initialEntries, entryFee }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState('');
  const [filterPaidTo, setFilterPaidTo] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Get unique paid_to values for the filter
  const paidToValues = useMemo(() => {
    const values = new Set<string>();
    entries.forEach((e) => {
      if (e.paid_to) values.add(e.paid_to);
    });
    return Array.from(values).sort();
  }, [entries]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = entries;

    // Filter by paid_to
    if (filterPaidTo !== 'all') {
      if (filterPaidTo === 'none') {
        result = result.filter((e) => !e.paid_to);
      } else {
        result = result.filter((e) => e.paid_to === filterPaidTo);
      }
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.team_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
          (e.paid_to ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'team_name':
          cmp = a.team_name.localeCompare(b.team_name);
          break;
        case 'name':
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'paid_to':
          cmp = (a.paid_to ?? '').localeCompare(b.paid_to ?? '');
          break;
        case 'payment_method':
          cmp = (a.payment_method ?? '').localeCompare(b.payment_method ?? '');
          break;
        case 'is_paid':
          cmp = (a.is_paid ? 1 : 0) - (b.is_paid ? 1 : 0);
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [entries, search, filterPaidTo, sortField, sortDir]);

  const paidCount = entries.filter((e) => e.is_paid).length;
  const totalCollected = paidCount * entryFee;

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
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Unpaid</p>
            <p className="text-2xl font-bold text-red-600">{entries.length - paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-2xl font-bold">${totalCollected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, team, or paid to..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPaidTo} onValueChange={(val) => val && setFilterPaidTo(val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Paying To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment destinations</SelectItem>
            <SelectItem value="none">No payment info</SelectItem>
            {paidToValues.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {entries.length} entries
        {filterPaidTo !== 'all' && ` (filtered: ${filterPaidTo === 'none' ? 'no payment info' : filterPaidTo})`}
      </p>

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
                  <TableHead>Email</TableHead>
                  <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('is_paid')}>
                    <span className="flex items-center justify-center">Paid <SortIcon field="is_paid" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('payment_method')}>
                    <span className="flex items-center">Method <SortIcon field="payment_method" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('paid_to')}>
                    <span className="flex items-center">Paying To <SortIcon field="paid_to" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                    <span className="flex items-center">Submitted <SortIcon field="created_at" /></span>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.team_name}</TableCell>
                    <TableCell>
                      {entry.first_name} {entry.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{entry.email}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={entry.is_paid}
                        onCheckedChange={(checked) =>
                          updateEntry(entry.id, { is_paid: !!checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={entry.payment_method ?? ''}
                        onValueChange={(val) =>
                          updateEntry(entry.id, { payment_method: val || null })
                        }
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Venmo">Venmo</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {entry.paid_to ?? <span className="text-gray-300">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/entries/${entry.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </Link>
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
