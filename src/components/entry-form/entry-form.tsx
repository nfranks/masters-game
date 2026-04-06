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

type Step = 'info' | 'picks' | 'payment' | 'review';

const PAYMENT_OPTIONS = [
  { value: 'venmo', label: 'Venmo (Preferred)', description: 'Scan QR code or tap the link below', paid_to: 'Venmo' },
  { value: 'nate', label: 'Nate', description: 'Pay Nate directly', paid_to: 'Nate' },
  { value: 'matt', label: 'Matt G', description: 'Pay Matt G directly', paid_to: 'Matt' },
  { value: 'charle', label: 'Charle', description: 'Pay Charle directly', paid_to: 'Charle' },
  { value: 'someone_else', label: 'Someone else is paying for me', description: 'Enter the name of the person paying', paid_to: '' },
];

export function EntryForm({ tournament, groups, golfers, rules }: Props) {
  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [paymentOption, setPaymentOption] = useState('');
  const [payerName, setPayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editLink, setEditLink] = useState('');
  const [emailError, setEmailError] = useState('');

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

  const selectedPayment = PAYMENT_OPTIONS.find((p) => p.value === paymentOption);
  const effectivePaidTo = paymentOption === 'someone_else' ? payerName.trim() : selectedPayment?.paid_to ?? '';

  const canSubmit =
    firstName && lastName && email && teamName && allGroupsFilled && allRulesMet && paymentOption &&
    (paymentOption !== 'someone_else' || payerName.trim());

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
          paid_to: effectivePaidTo,
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
          <h2 className="text-2xl font-bold text-masters-green mb-2">Team Submitted!</h2>
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
            {emailError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {emailError}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  setEmailError('');
                  try {
                    const res = await fetch('/api/entries/check-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, tournament_id: tournament.id }),
                    });
                    const { exists, team_name } = await res.json();
                    if (exists) {
                      setEmailError(
                        `An entry with this email has already been submitted${team_name ? ` (team: "${team_name}")` : ''}. Limit 1 entry per person.`
                      );
                      return;
                    }
                  } catch {
                    // If check fails, let them proceed — server will catch it on submit
                  }
                  setStep('picks');
                }}
                disabled={!firstName || !lastName || !email || !teamName}
                className="bg-masters-green hover:bg-masters-light"
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
              onClick={() => setStep('payment')}
              disabled={!allGroupsFilled || !allRulesMet}
              className="bg-masters-green hover:bg-masters-light"
            >
              Next: Payment <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <Card className="bg-white/95">
          <CardHeader>
            <CardTitle>Step 3: Payment (${tournament.entry_fee})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Venmo preferred - always shown at top */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
              <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">
                Preferred: Pay via Venmo
              </p>
              <img
                src="/venmo-qr.jpg"
                alt="Venmo QR Code"
                className="w-48 h-48 mx-auto mb-3 rounded-lg"
              />
              <a
                href="https://venmo.com/u/Jack-Kavanagh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Open Venmo &mdash; @Jack-Kavanagh
              </a>
              <p className="text-xs text-blue-700 mt-3 font-medium">
                Send as personal &bull; Put your <strong>Team Name</strong> in the payment description
              </p>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Select how you are paying your ${tournament.entry_fee} entry fee:
            </p>

            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPaymentOption(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    paymentOption === option.value
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentOption === option.value
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentOption === option.value && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {paymentOption === 'someone_else' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Label htmlFor="payer-name" className="text-sm font-medium">Who is paying for you?</Label>
                <Input
                  id="payer-name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Enter their name"
                  className="mt-2"
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('picks')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!paymentOption}
                className="bg-masters-green hover:bg-masters-light"
              >
                Review Team <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
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
              <div><span className="text-gray-500">Payment:</span> {selectedPayment?.label}{effectivePaidTo ? ` (${effectivePaidTo})` : ''}</div>
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
              <Button variant="outline" onClick={() => setStep('payment')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="bg-masters-gold hover:bg-masters-gold-deep text-masters-dark font-bold px-8"
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
