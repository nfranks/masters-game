'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Search } from 'lucide-react';
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

export function EntryTable({ entries: initialEntries, entryFee }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState('');

  const filtered = search
    ? entries.filter(
        (e) =>
          e.team_name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()) ||
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Submitted</TableHead>
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
                    <TableCell className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
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
