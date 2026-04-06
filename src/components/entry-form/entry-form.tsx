'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GroupPicker } from './group-picker';
import { RuleValidator } from './rule-validator';
import type { TournamentConfig, Group, Golfer, CompositionRule } from '@/lib/types';

interface Props {
  tournament: TournamentConfig;
  groups: Group[];
  golfers: Golfer[];
  rules: CompositionRule[];
}

type Step = 'info' | 'picks' | 'review';

export function EntryForm({ tournament, groups, golfers, rules }: Props) {
  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editLink, setEditLink] = useState('');

  const golfersByGroup = groups.map((group) => ({
    group,
    golfers: golfers.filter((g) => g.group_id === group.id),
  }));

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

  const canSubmit =
    firstName && lastName && email && teamName && allGroupsFilled && allRulesMet;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          first_name: firstName,
          last_name: lastName,
          email,
          team_name: teamName,
          selections,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const link = `${window.location.origin}/team/${result.entry.id}/edit?token=${result.edit_token}`;
      setEditLink(link);
      setSubmitted(true);
      toast.success('Team submitted!');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-white/95">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Team Submitted!</h2>
          <p className="text-gray-600 mb-1">
            <strong>{teamName}</strong> by {firstName} {lastName}
          </p>
          <p className="text-sm text-gray-500">
            Entry fee: ${tournament.entry_fee}. Pay via Venmo/PayPal to the pool organizer.
          </p>
          {editLink && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Bookmark this link to view or edit your team before the deadline:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={editLink}
                  className="flex-1 text-xs bg-white border rounded px-2 py-1 text-gray-600"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(editLink);
                    toast.success('Link copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Team:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedGolfers.map((g) => (
                <Badge key={g.id} variant="outline" className="text-sm">
                  {g.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rule validation sidebar */}
      <RuleValidator
        rules={rules}
        selectedGolfers={selectedGolfers}
        groups={groups}
        selections={selections}
      />

      {/* Step 1: Personal Info */}
      {step === 'info' && (
        <Card className="bg-white/95">
          <CardHeader>
            <CardTitle>Step 1: Your Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Team Name</Label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Something clever..." />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep('picks')}
                disabled={!firstName || !lastName || !email || !teamName}
                className="bg-green-700 hover:bg-green-800"
              >
                Next: Pick Your Team <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Group Picks */}
      {step === 'picks' && (
        <div className="space-y-6">
          {golfersByGroup.map(({ group, golfers: groupGolfers }) => (
            <GroupPicker
              key={group.id}
              group={group}
              golfers={groupGolfers}
              selected={selections[group.id] ?? []}
              onSelectionChange={(selected) =>
                setSelections((prev) => ({ ...prev, [group.id]: selected }))
              }
            />
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('info')} className="text-white border-white/30 hover:bg-white/10">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => setStep('review')}
              disabled={!allGroupsFilled || !allRulesMet}
              className="bg-green-700 hover:bg-green-800"
            >
              Review Team <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 'review' && (
        <Card className="bg-white/95">
          <CardHeader>
            <CardTitle>Review Your Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> {firstName} {lastName}</div>
              <div><span className="text-gray-500">Email:</span> {email}</div>
              <div><span className="text-gray-500">Team:</span> {teamName}</div>
              <div><span className="text-gray-500">Entry Fee:</span> ${tournament.entry_fee}</div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Your Golfers ({selectedGolfers.length})</h3>
              <div className="grid gap-2">
                {groups.map((group) => {
                  const picks = (selections[group.id] ?? []).map((id) =>
                    golfers.find((g) => g.id === id)
                  ).filter(Boolean);
                  return (
                    <div key={group.id} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-12 justify-center font-bold">
                        {group.name}
                      </Badge>
                      <span className="text-sm">
                        {picks.map((g) => g!.name).join(', ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('picks')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Edit Picks
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="bg-yellow-500 hover:bg-yellow-600 text-green-950 font-bold px-8"
                size="lg"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  'Submit Entry'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
