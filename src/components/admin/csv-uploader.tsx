'use client';

import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Check, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Group, Golfer } from '@/lib/types';

interface Props {
  tournamentId: string;
  groups: Group[];
  initialGolfers: (Golfer & { group: { name: string } | null })[];
}

type SortField = 'name' | 'group' | 'world_ranking' | 'region' | 'age_category';
type SortDir = 'asc' | 'desc';

export function CsvUploader({ tournamentId, groups, initialGolfers }: Props) {
  const [golfers, setGolfers] = useState(initialGolfers);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortField, setSortField] = useState<SortField>('world_ranking');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setPreview(result.data as Record<string, string>[]),
    });
  };

  const handleUpload = async () => {
    if (!preview?.length) return;
    setUploading(true);
    try {
      const res = await fetch('/api/golfers/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId, golfers: preview }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Imported ${result.imported} golfers`);
      setPreview(null);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const updateGolfer = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch(`/api/golfers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setGolfers(golfers.map((g) => (g.id === id ? { ...g, ...updated } : g)));
      toast.success('Golfer updated');
    } catch {
      toast.error('Failed to update golfer');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Group counts
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    golfers.forEach((g) => {
      const name = g.group?.name ?? '?';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return counts;
  }, [golfers]);

  const filtered = useMemo(() => {
    let result = golfers;

    if (filterGroup !== 'all') {
      result = result.filter((g) => g.group?.name === filterGroup);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'group': cmp = (a.group?.name ?? '').localeCompare(b.group?.name ?? ''); break;
        case 'world_ranking': cmp = (a.world_ranking ?? 9999) - (b.world_ranking ?? 9999); break;
        case 'region': cmp = (a.region ?? '').localeCompare(b.region ?? ''); break;
        case 'age_category': cmp = (a.age_category ?? '').localeCompare(b.age_category ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [golfers, search, filterGroup, sortField, sortDir]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Golfer CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            CSV should have columns: <code className="bg-gray-100 px-1 rounded">Name, Group, Rank, Age Range, Region, Rookie, Amateur</code>
          </p>
          <div className="flex gap-4">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Select CSV File
            </Button>
            {preview && (
              <Button onClick={handleUpload} disabled={uploading} className="bg-masters-green hover:bg-masters-light">
                <Check className="w-4 h-4 mr-2" />
                {uploading ? 'Importing...' : `Import ${preview.length} Golfers`}
              </Button>
            )}
          </div>
          {preview && (
            <div className="max-h-64 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0] ?? {}).map((col) => (
                      <TableHead key={col} className="text-xs">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} className="text-xs">{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.length > 10 && (
                <p className="text-xs text-gray-400 p-2 text-center">...and {preview.length - 10} more</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {golfers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Golfers ({golfers.length})</CardTitle>
              <div className="flex gap-2 text-xs">
                {groups.sort((a, b) => a.display_order - b.display_order).map((g) => (
                  <Badge
                    key={g.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setFilterGroup(filterGroup === g.name ? 'all' : g.name)}
                  >
                    {g.name}: {groupCounts.get(g.name) ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search golfers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterGroup} onValueChange={(val) => val && setFilterGroup(val)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groups.sort((a, b) => a.display_order - b.display_order).map((g) => (
                    <SelectItem key={g.id} value={g.name}>{g.name} ({groupCounts.get(g.name) ?? 0})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-gray-500">Showing {filtered.length} golfers</p>

            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <span className="flex items-center">Name <SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('group')}>
                      <span className="flex items-center">Group <SortIcon field="group" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('world_ranking')}>
                      <span className="flex items-center">Rank <SortIcon field="world_ranking" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('region')}>
                      <span className="flex items-center">Region <SortIcon field="region" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('age_category')}>
                      <span className="flex items-center">Age <SortIcon field="age_category" /></span>
                    </TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>
                        <Select
                          value={g.group_id}
                          onValueChange={(val) => val && updateGolfer(g.id, { group_id: val })}
                        >
                          <SelectTrigger className="w-20 h-8 text-xs">
                            {g.group?.name ?? '?'}
                          </SelectTrigger>
                          <SelectContent>
                            {groups.sort((a, b) => a.display_order - b.display_order).map((group) => (
                              <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-16 h-8 text-xs"
                          defaultValue={g.world_ranking ?? ''}
                          onBlur={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            if (val !== g.world_ranking) updateGolfer(g.id, { world_ranking: val });
                          }}
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={g.region ?? 'none'}
                          onValueChange={(val) => val && updateGolfer(g.id, { region: val === 'none' ? null : val })}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            {g.region === 'United States' ? 'USA' : g.region ?? '-'}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="United States">USA</SelectItem>
                            <SelectItem value="Europe">Europe</SelectItem>
                            <SelectItem value="International">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={g.age_category ?? 'none'}
                          onValueChange={(val) => val && updateGolfer(g.id, { age_category: val === 'none' ? null : val })}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            {g.age_category ?? '-'}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="Under 30">Under 30</SelectItem>
                            <SelectItem value="Over 40">Over 40</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox
                              checked={g.is_rookie}
                              onCheckedChange={(checked) => updateGolfer(g.id, { is_rookie: !!checked })}
                            />
                            Rookie
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox
                              checked={g.is_amateur}
                              onCheckedChange={(checked) => updateGolfer(g.id, { is_amateur: !!checked })}
                            />
                            Amateur
                          </label>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
