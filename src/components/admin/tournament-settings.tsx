'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { TournamentConfig } from '@/lib/types';

interface Props {
  tournament: TournamentConfig | null;
}

export function TournamentSettings({ tournament }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(tournament?.name ?? 'Masters Pool');
  const [year, setYear] = useState(tournament?.year ?? new Date().getFullYear());
  const [entryFee, setEntryFee] = useState(tournament?.entry_fee ?? 20);
  const [deadline, setDeadline] = useState(
    tournament?.entry_deadline
      ? new Date(tournament.entry_deadline).toISOString().slice(0, 16)
      : ''
  );
  const [status, setStatus] = useState(tournament?.status ?? 'setup');
  const [espnEventId, setEspnEventId] = useState(tournament?.espn_event_id ?? '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tournament', {
        method: tournament ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tournament?.id,
          name,
          year,
          entry_fee: entryFee,
          entry_deadline: deadline ? new Date(deadline).toISOString() : null,
          status,
          espn_event_id: espnEventId || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Tournament settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <div>
        <Label htmlFor="name">Tournament Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="year">Year</Label>
        <Input id="year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>
      <div>
        <Label htmlFor="fee">Entry Fee ($)</Label>
        <Input id="fee" type="number" value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))} />
      </div>
      <div>
        <Label htmlFor="deadline">Entry Deadline</Label>
        <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(val) => val && setStatus(val as typeof status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="setup">Setup</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="espn">ESPN Event ID</Label>
        <Input id="espn" value={espnEventId} onChange={(e) => setEspnEventId(e.target.value)} placeholder="Auto-detected during tournament" />
      </div>
      <div className="md:col-span-2">
        <Button onClick={handleSave} disabled={loading} className="bg-green-700 hover:bg-green-800">
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
