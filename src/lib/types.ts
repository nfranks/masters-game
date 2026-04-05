export interface TournamentConfig {
  id: string;
  year: number;
  name: string;
  entry_fee: number;
  entry_deadline: string | null;
  status: 'setup' | 'open' | 'closed' | 'in_progress' | 'completed';
  espn_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  tournament_id: string;
  name: string;
  display_order: number;
  picks_required: number;
  created_at: string;
  updated_at: string;
}

export interface Golfer {
  id: string;
  tournament_id: string;
  group_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  world_ranking: number | null;
  region: 'United States' | 'Europe' | 'International' | null;
  age_category: 'Under 30' | 'Over 40' | null;
  is_rookie: boolean;
  is_amateur: boolean;
  espn_athlete_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompositionRule {
  id: string;
  tournament_id: string;
  field_name: string;
  field_value: string;
  min_count: number;
  label: string;
  created_at: string;
}

export interface Entry {
  id: string;
  tournament_id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_name: string;
  total_points: number;
  is_paid: boolean;
  payment_method: 'Venmo' | 'PayPal' | 'Cash' | 'Other' | null;
  paid_to: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryGolfer {
  id: string;
  entry_id: string;
  golfer_id: string;
  group_id: string;
}

export interface GolferScore {
  id: string;
  golfer_id: string;
  tournament_id: string;
  round_number: number;
  total_strokes: number | null;
  score_to_par: number | null;
  hole_scores: number[] | null;
  hole_pars: number[] | null;
  eagles: number;
  double_eagles: number;
  holes_in_one: number;
  is_best_round_of_day: boolean;
  source: 'espn' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface GolferResult {
  id: string;
  golfer_id: string;
  tournament_id: string;
  final_position: number | null;
  total_strokes: number | null;
  total_score_to_par: number | null;
  made_cut: boolean;
  is_best_round_of_tournament: boolean;
  tournament_points: number;
  daily_points: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// Composite types for UI

export interface GolferWithGroup extends Golfer {
  group: Group;
}

export interface GroupWithGolfers extends Group {
  golfers: Golfer[];
}

export interface EntryWithGolfers extends Entry {
  golfers: (EntryGolfer & { golfer: Golfer; result?: GolferResult })[];
}

export interface LeaderboardEntry {
  rank: number;
  entry: Entry;
  golfer_details: {
    golfer: Golfer;
    result: GolferResult | null;
    scores: GolferScore[];
  }[];
}

export interface DailyStanding {
  rank: number;
  entry: Entry;
  total_strokes: number;
  net_vs_par: number;
  players_played: number;
}

export interface TeamValidation {
  valid: boolean;
  violations: {
    rule: CompositionRule;
    actual: number;
  }[];
  group_errors: {
    group: Group;
    required: number;
    selected: number;
  }[];
}
