import type { Golfer, Group, CompositionRule, TeamValidation } from '@/lib/types';

export function validateTeam(
  selectedGolfers: Golfer[],
  groups: Group[],
  rules: CompositionRule[],
  selections: Record<string, string[]> // groupId -> golferIds
): TeamValidation {
  const violations: TeamValidation['violations'] = [];
  const group_errors: TeamValidation['group_errors'] = [];

  // Check picks per group
  for (const group of groups) {
    const selected = selections[group.id]?.length ?? 0;
    if (selected !== group.picks_required) {
      group_errors.push({
        group,
        required: group.picks_required,
        selected,
      });
    }
  }

  // Check composition rules
  for (const rule of rules) {
    const count = selectedGolfers.filter((g) => {
      if (rule.field_name === 'region') return g.region === rule.field_value;
      if (rule.field_name === 'age_category') return g.age_category === rule.field_value;
      if (rule.field_name === 'is_rookie') return g.is_rookie === (rule.field_value === 'true');
      if (rule.field_name === 'is_amateur') return g.is_amateur === (rule.field_value === 'true');
      return false;
    }).length;

    if (count < rule.min_count) {
      violations.push({ rule, actual: count });
    }
  }

  return {
    valid: violations.length === 0 && group_errors.length === 0,
    violations,
    group_errors,
  };
}

export function getRuleProgress(
  selectedGolfers: Golfer[],
  rule: CompositionRule
): { count: number; required: number; met: boolean } {
  const count = selectedGolfers.filter((g) => {
    if (rule.field_name === 'region') return g.region === rule.field_value;
    if (rule.field_name === 'age_category') return g.age_category === rule.field_value;
    if (rule.field_name === 'is_rookie') return g.is_rookie === (rule.field_value === 'true');
    if (rule.field_name === 'is_amateur') return g.is_amateur === (rule.field_value === 'true');
    return false;
  }).length;

  return { count, required: rule.min_count, met: count >= rule.min_count };
}
