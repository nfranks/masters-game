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
  id: string;
  athlete: {
    id: string;
    fullName: string;
    displayName: string;
  };
  score: string; // e.g. "-10" or "E"
  order: number; // tournament position
  status: {
    type: {
      name: string; // "STATUS_CUT", "STATUS_ACTIVE", etc.
    };
    period: number;
  };
  linescores: ESPNRoundScore[];
}

export interface ESPNRoundScore {
  period: number; // round number
  value: number; // total strokes for round
  displayValue: string;
  linescores?: ESPNHoleScore[];
}

export interface ESPNHoleScore {
  period: number; // hole number
  value: number; // strokes taken
  displayValue: string;
}
