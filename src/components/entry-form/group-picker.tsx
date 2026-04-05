'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Group, Golfer } from '@/lib/types';

interface Props {
  group: Group;
  golfers: Golfer[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function GroupPicker({ group, golfers, selected, onSelectionChange }: Props) {
  const isFull = selected.length >= group.picks_required;

  const toggleGolfer = (golferId: string) => {
    if (selected.includes(golferId)) {
      onSelectionChange(selected.filter((id) => id !== golferId));
    } else if (!isFull) {
      onSelectionChange([...selected, golferId]);
    }
  };

  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Group {group.name}
          </CardTitle>
          <Badge
            className={cn(
              selected.length === group.picks_required
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            )}
          >
            {selected.length}/{group.picks_required} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {golfers.map((golfer) => {
            const isSelected = selected.includes(golfer.id);
            const isDisabled = !isSelected && isFull;

            return (
              <button
                key={golfer.id}
                onClick={() => toggleGolfer(golfer.id)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50 cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{golfer.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {golfer.world_ranking && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        #{golfer.world_ranking}
                      </Badge>
                    )}
                    {golfer.region && (
                      <Badge
                        className={cn('text-[10px] px-1 py-0', {
                          'bg-blue-100 text-blue-800': golfer.region === 'Europe',
                          'bg-orange-100 text-orange-800': golfer.region === 'International',
                          'bg-gray-100 text-gray-700': golfer.region === 'United States',
                        })}
                      >
                        {golfer.region === 'United States' ? 'USA' : golfer.region}
                      </Badge>
                    )}
                    {golfer.age_category && (
                      <Badge className="text-[10px] px-1 py-0 bg-purple-100 text-purple-800">
                        {golfer.age_category}
                      </Badge>
                    )}
                    {golfer.is_rookie && (
                      <Badge className="text-[10px] px-1 py-0 bg-green-100 text-green-800">
                        Rookie
                      </Badge>
                    )}
                    {golfer.is_amateur && (
                      <Badge className="text-[10px] px-1 py-0 bg-yellow-100 text-yellow-800">
                        Amateur
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
