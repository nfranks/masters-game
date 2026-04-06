'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { GroupPicker } from './group-picker';
import { RuleValidator } from './rule-validator';
import type { Group, Golfer, CompositionRule, Entry } from '@/lib/types';

interface Props {
  entry: Entry;
  token: string;
  groups: Group[];
  golfers: Golfer[];
  rules: CompositionRule[];
  currentSelections: Record<string, string[]>;
  isEditable: boolean;
}

export function EditForm({
  entry,
  token,
  groups,
  golfers,
  rules,
  currentSelections,
  isEditable,
}: Props) {
  const [selections, setSelections] = useState<Record<string, string[]>>(currentSelections);
  const [teamName, setTeamName] = useState(entry.team_name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedGolfers = golfers.filter((g) =>
    Object.values(selections).flat().includes(g.id)
  );

  const allGroupsFilled = groups.every(
    (g) => (selections[g.id]?.length ?? 0) === g.picks_required
  );

  const allRulesMet = rules.every((rule) => {
    const count = selectedGolfers.filter((g) => {
      if (rule.field_name === 'region') return g.region === rule.field_value;
      if (rule.field_name === 'age_category') return g.age_category === rule.field_value;
      if (rule.field_name === 'is_rookie') return g.is_rookie === (rule.field_value === 'true');
      if (rule.field_name === 'is_amateur') return g.is_amateur === (rule.field_value === 'true');
      return false;
    }).length;
    return count >= rule.min_count;
  });

  const hasChanges =
    teamName !== entry.team_name ||
    JSON.stringify(selections) !== JSON.stringify(currentSelections);

  const canSave = allGroupsFilled && allRulesMet && hasChanges && isEditable;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.id,
          edit_token: token,
          selections,
          team_name: teamName,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSaved(true);
      toast.success('Team updated!');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Card className="bg-white/95">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Team Updated!</h2>
          <p className="text-gray-600 mb-4">
            <strong>{teamName}</strong> has been saved.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {selectedGolfers.map((g) => (
              <Badge key={g.id} variant="outline" className="text-sm">
                {g.name}
              </Badge>
            ))}
          </div>
          <Button
            onClick={() => setSaved(false)}
            variant="outline"
          >
            Make More Changes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const golfersByGroup = groups.map((group) => ({
    group,
    golfers: golfers.filter((g) => g.group_id === group.id),
  }));

  return (
    <div className="space-y-6">
      <RuleValidator
        rules={rules}
        selectedGolfers={selectedGolfers}
        groups={groups}
        selections={selections}
      />

      {isEditable && (
        <Card className="bg-white/95">
          <CardContent className="py-4">
            <Label>Team Name</Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {golfersByGroup.map(({ group, golfers: groupGolfers }) => (
        <GroupPicker
          key={group.id}
          group={group}
          golfers={groupGolfers}
          selected={selections[group.id] ?? []}
          onSelectionChange={(selected) =>
            isEditable
              ? setSelections((prev) => ({ ...prev, [group.id]: selected }))
              : undefined
          }
        />
      ))}

      {isEditable && (
        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-yellow-500 hover:bg-yellow-600 text-green-950 font-bold px-8"
            size="lg"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
