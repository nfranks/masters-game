'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Search, DollarSign, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_name: string;
  is_paid: boolean;
  payment_method: string | null;
  paid_to: string | null;
  created_at: string;
}

interface Props {
  entries: Entry[];
  entryFee: number;
}

type SortField = 'name' | 'team_name' | 'paid_to' | 'payment_method' | 'is_paid';
type SortDir = 'asc' | 'desc';

export function PaymentsView({ entries: initialEntries, entryFee }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState('');
  const [filterDest, setFilterDest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('paid_to');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Compute destination summaries
  const destSummary = useMemo(() => {
    const map = new Map<string, { total: number; paid: number; unpaid: number }>();
    for (const e of entries) {
      const dest = e.paid_to || 'Unspecified';
      if (!map.has(dest)) map.set(dest, { total: 0, paid: 0, unpaid: 0 });
      const s = map.get(dest)!;
      s.total++;
      if (e.is_paid) s.paid++;
      else s.unpaid++;
    }
    return Array.from(map.entries())
      .map(([dest, stats]) => ({ dest, ...stats, collected: stats.paid * entryFee }))
      .sort((a, b) => b.total - a.total);
  }, [entries, entryFee]);

  const totalPaid = entries.filter((e) => e.is_paid).length;
  const totalUnpaid = entries.filter((e) => !e.is_paid).length;
  const totalCollected = totalPaid * entryFee;
  const totalExpected = entries.length * entryFee;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = entries;

    if (filterDest !== 'all') {
      if (filterDest === 'unspecified') result = result.filter((e) => !e.paid_to);
      else result = result.filter((e) => e.paid_to === filterDest);
    }

    if (filterStatus === 'paid') result = result.filter((e) => e.is_paid);
    else if (filterStatus === 'unpaid') result = result.filter((e) => !e.is_paid);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.team_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`); break;
        case 'team_name': cmp = a.team_name.localeCompare(b.team_name); break;
        case 'paid_to': cmp = (a.paid_to ?? '').localeCompare(b.paid_to ?? ''); break;
        case 'payment_method': cmp = (a.payment_method ?? '').localeCompare(b.payment_method ?? ''); break;
        case 'is_paid': cmp = (a.is_paid ? 1 : 0) - (b.is_paid ? 1 : 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [entries, search, filterDest, filterStatus, sortField, sortDir]);

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
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top-level summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Entries</p>
            <p className="text-3xl font-serif font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Collected</p>
            <p className="text-3xl font-serif font-bold text-green-700">${totalCollected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Outstanding</p>
            <p className="text-3xl font-serif font-bold text-red-600">${totalExpected - totalCollected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Expected Total</p>
            <p className="text-3xl font-serif font-bold">${totalExpected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-destination breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collection by Destination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {destSummary.map(({ dest, total, paid, unpaid, collected }) => (
              <button
                key={dest}
                onClick={() => setFilterDest(filterDest === dest ? 'all' : (dest === 'Unspecified' ? 'unspecified' : dest))}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  (filterDest === dest || (filterDest === 'unspecified' && dest === 'Unspecified'))
                    ? 'border-masters-green bg-green-50 ring-1 ring-masters-green'
                    : 'border-gray-200 hover:border-masters-green/50'
                )}
              >
                <p className="font-medium text-sm truncate">{dest}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-green-700">${collected}</span>
                  <span className="text-xs text-gray-500">of ${total * entryFee}</span>
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-600">{paid} paid</span>
                  {unpaid > 0 && <span className="text-red-500">{unpaid} unpaid</span>}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, team, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDest} onValueChange={(val) => val && setFilterDest(val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All destinations</SelectItem>
            <SelectItem value="unspecified">Unspecified</SelectItem>
            {destSummary.filter((d) => d.dest !== 'Unspecified').map((d) => (
              <SelectItem key={d.dest} value={d.dest}>{d.dest} ({d.total})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(val) => val && setFilterStatus(val)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid ({totalPaid})</SelectItem>
            <SelectItem value="unpaid">Unpaid ({totalUnpaid})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} entries
        {filterDest !== 'all' && ` \u2022 ${filterDest === 'unspecified' ? 'No destination' : filterDest}`}
        {filterStatus !== 'all' && ` \u2022 ${filterStatus}`}
      </p>

      {/* Entry table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="flex items-center">Name <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('team_name')}>
                    <span className="flex items-center">Team <SortIcon field="team_name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('payment_method')}>
                    <span className="flex items-center">Method <SortIcon field="payment_method" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('paid_to')}>
                    <span className="flex items-center">Paying To <SortIcon field="paid_to" /></span>
                  </TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('is_paid')}>
                    <span className="flex items-center justify-center">Paid <SortIcon field="is_paid" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className={cn(!entry.is_paid && 'bg-red-50/50')}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{entry.first_name} {entry.last_name}</p>
                        <p className="text-xs text-gray-400">{entry.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.team_name}</TableCell>
                    <TableCell>
                      <Select
                        value={entry.payment_method ?? ''}
                        onValueChange={(val) => updateEntry(entry.id, { payment_method: val || null })}
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
                    <TableCell className="text-right font-medium">${entryFee}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={entry.is_paid}
                        onCheckedChange={(checked) => updateEntry(entry.id, { is_paid: !!checked })}
                      />
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
