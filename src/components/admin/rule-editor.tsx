'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CompositionRule } from '@/lib/types';

const RULE_PRESETS = [
  { field_name: 'region', field_value: 'Europe', min_count: 2, label: 'At least 2 from Europe' },
  { field_name: 'region', field_value: 'International', min_count: 2, label: 'At least 2 from International' },
  { field_name: 'age_category', field_value: 'Under 30', min_count: 2, label: 'At least 2 under 30' },
  { field_name: 'age_category', field_value: 'Over 40', min_count: 1, label: 'At least 1 over 40' },
  { field_name: 'is_rookie', field_value: 'true', min_count: 1, label: 'At least 1 rookie' },
];

interface Props {
  tournamentId: string;
  initialRules: CompositionRule[];
}

export function RuleEditor({ tournamentId, initialRules }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [fieldName, setFieldName] = useState('region');
  const [fieldValue, setFieldValue] = useState('');
  const [minCount, setMinCount] = useState(1);
  const [ruleLabel, setRuleLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const addRule = async (rule: typeof RULE_PRESETS[0]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId, ...rule }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newRule = await res.json();
      setRules([...rules, newRule]);
      toast.success('Rule added');
    } catch {
      toast.error('Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (rule: CompositionRule) => {
    try {
      const res = await fetch(`/api/admin/rules?id=${rule.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setRules(rules.filter((r) => r.id !== rule.id));
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const addDefaultRules = async () => {
    setLoading(true);
    for (const preset of RULE_PRESETS) {
      await addRule(preset);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {rules.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">No composition rules configured.</p>
            <Button onClick={addDefaultRules} disabled={loading}>
              Add Default Rules
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-xs text-gray-500">
                  {rule.field_name} = &quot;{rule.field_value}&quot;, min: {rule.min_count}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteRule(rule)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-medium mb-3">Add Custom Rule</p>
          <div className="flex items-end gap-3">
            <div>
              <Label>Field</Label>
              <Select value={fieldName} onValueChange={(val) => val && setFieldName(val)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="region">Region</SelectItem>
                  <SelectItem value="age_category">Age Category</SelectItem>
                  <SelectItem value="is_rookie">Rookie</SelectItem>
                  <SelectItem value="is_amateur">Amateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="e.g. Europe"
                className="w-36"
              />
            </div>
            <div>
              <Label>Min Count</Label>
              <Input
                type="number"
                min={1}
                value={minCount}
                onChange={(e) => setMinCount(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <div className="flex-1">
              <Label>Label</Label>
              <Input
                value={ruleLabel}
                onChange={(e) => setRuleLabel(e.target.value)}
                placeholder="At least X from Y"
              />
            </div>
            <Button
              onClick={() => {
                if (fieldValue && ruleLabel) {
                  addRule({ field_name: fieldName, field_value: fieldValue, min_count: minCount, label: ruleLabel });
                  setFieldValue('');
                  setRuleLabel('');
                }
              }}
              disabled={loading || !fieldValue || !ruleLabel}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
