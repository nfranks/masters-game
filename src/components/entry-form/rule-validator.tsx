'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRuleProgress } from '@/lib/validation/team-rules';
import type { Golfer, Group, CompositionRule } from '@/lib/types';

interface Props {
  rules: CompositionRule[];
  selectedGolfers: Golfer[];
  groups: Group[];
  selections: Record<string, string[]>;
}

export function RuleValidator({ rules, selectedGolfers, groups, selections }: Props) {
  const totalPicks = groups.reduce((sum, g) => sum + g.picks_required, 0);
  const currentPicks = Object.values(selections).flat().length;

  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Team Requirements ({currentPicks}/{totalPicks} golfers selected)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Group requirements */}
          {groups.map((group) => {
            const selected = selections[group.id]?.length ?? 0;
            const met = selected === group.picks_required;
            return (
              <div
                key={group.id}
                className={cn(
                  'flex items-center gap-2 text-sm px-2 py-1 rounded',
                  met ? 'text-green-700 bg-green-50' : 'text-gray-500'
                )}
              >
                {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-gray-300" />}
                Group {group.name}: {selected}/{group.picks_required}
              </div>
            );
          })}

          {/* Composition rules */}
          {rules.map((rule) => {
            const progress = getRuleProgress(selectedGolfers, rule);
            return (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-2 text-sm px-2 py-1 rounded',
                  progress.met ? 'text-green-700 bg-green-50' : 'text-gray-500'
                )}
              >
                {progress.met ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3 text-gray-300" />
                )}
                {rule.label}: {progress.count}/{progress.required}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
