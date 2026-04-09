export interface ESPNResponse {
  events: ESPNEvent[];
}

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  competitions: ESPNCompetition[];
}

export interface ESPNCompetition {
  id: string;
  competitors: ESPNCompetitor[];
  status: {
    type: {
      name: string;
      completed: boolean;
    };
    period: number;
  };
}

export interface ESPNCompetitor {
  id: string; // athlete ID lives here (top-level on competitor)
  uid?: string;
  order: number; // tournament position
  athlete: {
    id?: string; // sometimes present, sometimes not
    fullName: string;
    displayName: string;
    shortName?: string;
  };
  score: string; // e.g. "-10" or "E"
  status?: {
    type?: {
      name?: string; // "STATUS_CUT", "STATUS_ACTIVE", etc.
    };
    period?: number;
  };
  linescores: ESPNRoundScore[];
  statistics?: any[];
}

export interface ESPNRoundScore {
  period: number; // round number
  value?: number; // total strokes for round (may be absent for future rounds)
  displayValue?: string; // score-to-par display like "-3", "E", "+2"
  linescores?: ESPNHoleScore[];
  statistics?: any;
}

export interface ESPNHoleScore {
  period: number; // hole number
  value: number; // strokes taken
  displayValue: string;
  scoreType?: {
    displayValue: string; // relative to par display
  };
}
