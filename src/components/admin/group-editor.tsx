'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Group } from '@/lib/types';

interface Props {
  tournamentId: string;
  initialGroups: Group[];
}

export function GroupEditor({ tournamentId, initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [newName, setNewName] = useState('');
  const [newPicks, setNewPicks] = useState(2);
  const [loading, setLoading] = useState(false);

  const addGroup = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournamentId,
          name: newName.trim(),
          display_order: groups.length,
          picks_required: newPicks,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const group = await res.json();
      setGroups([...groups, group]);
      setNewName('');
      setNewPicks(2);
      toast.success(`Group "${group.name}" added`);
    } catch {
      toast.error('Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (group: Group, updates: Partial<Group>) => {
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: group.id, ...updates }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setGroups(groups.map((g) => (g.id === group.id ? updated : g)));
      toast.success('Group updated');
    } catch {
      toast.error('Failed to update group');
    }
  };

  const deleteGroup = async (group: Group) => {
    if (!confirm(`Delete group "${group.name}"? This will also remove any golfers in this group.`)) return;
    try {
      const res = await fetch(`/api/admin/groups?id=${group.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setGroups(groups.filter((g) => g.id !== group.id));
      toast.success(`Group "${group.name}" deleted`);
    } catch {
      toast.error('Failed to delete group');
    }
  };

  const addDefaultGroups = async () => {
    const defaults = [
      { name: '1A', picks_required: 1 },
      { name: 'A', picks_required: 2 },
      { name: 'B', picks_required: 2 },
      { name: 'C', picks_required: 2 },
      { name: 'D', picks_required: 2 },
      { name: 'E', picks_required: 2 },
      { name: 'F', picks_required: 2 },
    ];
    setLoading(true);
    try {
      for (let i = 0; i < defaults.length; i++) {
        const res = await fetch('/api/admin/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournament_id: tournamentId,
            name: defaults[i].name,
            display_order: i,
            picks_required: defaults[i].picks_required,
          }),
        });
        if (res.ok) {
          const group = await res.json();
          setGroups((prev) => [...prev, group]);
        }
      }
      toast.success('Default groups added');
    } catch {
      toast.error('Failed to add default groups');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {groups.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">No groups configured yet.</p>
            <Button onClick={addDefaultGroups} disabled={loading}>
              Add Default Groups (1A, A-F)
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="py-3 flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroup(group, { name: e.target.value })}
                    className="font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Order</Label>
                  <Input
                    type="number"
                    value={group.display_order}
                    onChange={(e) =>
                      updateGroup(group, { display_order: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Picks Required</Label>
                  <Input
                    type="number"
                    min={1}
                    value={group.picks_required}
                    onChange={(e) =>
                      updateGroup(group, { picks_required: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteGroup(group)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Group Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. G"
              />
            </div>
            <div className="w-32">
              <Label>Picks Required</Label>
              <Input
                type="number"
                min={1}
                value={newPicks}
                onChange={(e) => setNewPicks(Number(e.target.value))}
              />
            </div>
            <Button onClick={addGroup} disabled={loading || !newName.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add Group
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
