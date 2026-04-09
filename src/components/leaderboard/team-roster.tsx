'use client';

import { useState } from 'react';
import { GolferPhoto } from '@/components/shared/golfer-photo';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X } from 'lucide-react';

interface GolferDetail {
  golfer: {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    world_ranking: number | null;
    region: string | null;
    age_category: string | null;
    is_rookie: boolean;
    is_amateur: boolean;
    masters_player_id: string | null;
    group: { name: string; display_order?: number } | null;
  };
  result: {
    final_position: number | null;
    made_cut: boolean;
    total_score_to_par: number | null;
    tournament_points: number;
    daily_points: number;
    total_points: number;
  } | null;
  scores: {
    round_number: number;
    total_strokes: number | null;
    score_to_par: number | null;
    eagles: number;
    double_eagles: number;
    holes_in_one: number;
    hole_scores: number[] | null;
    is_best_round_of_day: boolean;
  }[];
}

function formatPar(par: number | null) {
  if (par === null || par === undefined) return '-';
  if (par === 0) return 'E';
  return par > 0 ? `+${par}` : `${par}`;
}

function getRoundPoints(score: GolferDetail['scores'][0]) {
  return (
    (score.eagles ?? 0) * 1 +
    (score.double_eagles ?? 0) * 3 +
    (score.holes_in_one ?? 0) * 5 +
    (score.is_best_round_of_day ? 5 : 0)
  );
}

export function TeamRoster({ golferDetails }: { golferDetails: GolferDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const expanded = golferDetails.find((gd) => gd.golfer.id === expandedId);

  return (
    <>
      {/* Roster Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {golferDetails.map((gd) => {
          const g = gd.golfer;
          const result = gd.result;
          const isExpanded = expandedId === g.id;

          return (
            <button
              key={g.id}
              onClick={() => setExpandedId(isExpanded ? null : g.id)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                isExpanded
                  ? 'bg-masters-green ring-2 ring-masters-gold'
                  : 'bg-white/95 hover:bg-white hover:ring-1 hover:ring-masters-green/30'
              }`}
            >
              <GolferPhoto
                name={g.name}
                mastersPlayerId={g.masters_player_id}
                size={72}
              />
              <p className={`font-serif font-bold text-xs mt-2 text-center leading-tight ${
                isExpanded ? 'text-white' : 'text-masters-green'
              }`}>
                {g.first_name ?? g.name.split(' ')[0]}
              </p>
              <p className={`font-serif text-[10px] text-center leading-tight ${
                isExpanded ? 'text-white/70' : 'text-gray-500'
              }`}>
                {g.last_name ?? g.name.split(' ').slice(1).join(' ')}
              </p>
              <Badge
                variant="outline"
                className={`mt-1.5 text-[9px] px-1.5 py-0 ${
                  isExpanded ? 'border-white/40 text-white/80' : ''
                }`}
              >
                {g.group?.name}
              </Badge>
              {result?.total_score_to_par !== null && result?.total_score_to_par !== undefined && (
                <p className={`text-sm font-bold mt-1 ${
                  isExpanded ? 'text-white/80' :
                  result.total_score_to_par < 0 ? 'text-red-600' :
                  result.total_score_to_par > 0 ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {formatPar(result.total_score_to_par)}
                </p>
              )}
              <p className={`text-lg font-bold ${result?.total_score_to_par != null ? 'mt-0' : 'mt-1'} ${
                isExpanded
                  ? 'text-masters-gold'
                  : (result?.total_points ?? 0) > 0
                  ? 'text-masters-green'
                  : 'text-gray-300'
              }`}>
                {result?.total_points ?? 0}
              </p>
              <p className={`text-[9px] ${isExpanded ? 'text-white/50' : 'text-gray-400'}`}>pts</p>
            </button>
          );
        })}
      </div>

      {/* Expanded Detail Drawer */}
      {expanded && (
        <div className="mt-4 bg-white/95 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="bg-masters-green p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GolferPhoto
                name={expanded.golfer.name}
                mastersPlayerId={expanded.golfer.masters_player_id}
                size={56}
              />
              <div>
                <div className="flex items-center gap-2">
                  {expanded.golfer.masters_player_id ? (
                    <a
                      href={`https://www.masters.com/en_US/players/player_${expanded.golfer.masters_player_id}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif font-bold text-lg text-white hover:text-masters-gold flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {expanded.golfer.name}
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  ) : (
                    <span className="font-serif font-bold text-lg text-white">
                      {expanded.golfer.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/40 text-white/80 font-bold">
                    Group {expanded.golfer.group?.name}
                  </Badge>
                  {expanded.golfer.world_ranking && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/40 text-white/80">
                      #{expanded.golfer.world_ranking}
                    </Badge>
                  )}
                  {expanded.golfer.region && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-white/20 text-white/90">
                      {expanded.golfer.region === 'United States' ? 'USA' : expanded.golfer.region}
                    </Badge>
                  )}
                  {expanded.golfer.age_category && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-white/20 text-white/90">
                      {expanded.golfer.age_category}
                    </Badge>
                  )}
                  {expanded.golfer.is_rookie && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-white/20 text-white/90">
                      Rookie
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setExpandedId(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Position & Status */}
            {expanded.result && (
              <div className="flex gap-4 mb-4 text-sm">
                {expanded.result.final_position && (
                  <span className="text-gray-600">
                    Position: <strong className="text-gray-900">T{expanded.result.final_position}</strong>
                  </span>
                )}
                {expanded.result.made_cut ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">Made Cut</Badge>
                ) : expanded.result.made_cut === false ? (
                  <Badge className="bg-red-100 text-red-800 text-xs">Missed Cut</Badge>
                ) : null}
                {expanded.result.total_score_to_par !== null && (
                  <span className="text-gray-600">
                    Total: <strong>{formatPar(expanded.result.total_score_to_par)}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Scoring Grid */}
            <div className="grid grid-cols-6 text-center border rounded-lg overflow-hidden">
              {/* Headers */}
              {['Thu', 'Fri', 'Sat', 'Sun', 'Tourn', 'Total'].map((label, i) => (
                <div
                  key={label}
                  className={`text-[10px] uppercase tracking-wider py-2 px-1 font-medium border-b ${
                    i === 5 ? 'bg-masters-green/10 text-masters-green' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {label}
                </div>
              ))}

              {/* Scores (to par) */}
              {[1, 2, 3, 4].map((r) => {
                const score = expanded.scores.find((s) => s.round_number === r);
                const holesPlayed = score?.hole_scores?.length ?? 0;
                const isComplete = holesPlayed >= 18;
                return (
                  <div key={`s-${r}`} className="py-2 px-1 text-sm border-b">
                    {score ? (
                      <>
                        <span className={`font-medium ${
                          (score.score_to_par ?? 0) < 0 ? 'text-red-600' :
                          (score.score_to_par ?? 0) > 0 ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {formatPar(score.score_to_par)}
                        </span>
                        {!isComplete && holesPlayed > 0 && (
                          <div className="text-[9px] text-gray-400">thru {holesPlayed}</div>
                        )}
                        {((score.eagles ?? 0) > 0 || (score.holes_in_one ?? 0) > 0 || (score.double_eagles ?? 0) > 0) && (
                          <div className="text-[9px] text-green-600 mt-0.5">
                            {score.eagles > 0 && `${score.eagles}🦅`}
                            {score.double_eagles > 0 && ` ${score.double_eagles}🦅🦅`}
                            {score.holes_in_one > 0 && ` ${score.holes_in_one}🕳️`}
                          </div>
                        )}
                      </>
                    ) : '-'}
                  </div>
                );
              })}
              <div className="py-2 px-1 text-sm text-gray-600 border-b">
                {expanded.result?.final_position ? `T${expanded.result.final_position}` : '-'}
              </div>
              <div className={`py-2 px-1 text-sm font-bold border-b bg-masters-green/5 ${
                (expanded.result?.total_score_to_par ?? 0) < 0 ? 'text-red-600' :
                (expanded.result?.total_score_to_par ?? 0) > 0 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {formatPar(expanded.result?.total_score_to_par ?? null)}
              </div>

              {/* Points */}
              {[1, 2, 3, 4].map((r) => {
                const score = expanded.scores.find((s) => s.round_number === r);
                if (!score) return <div key={`p-${r}`} className="py-2 px-1 text-sm font-bold text-gray-300">-</div>;
                const pts = getRoundPoints(score);
                return (
                  <div key={`p-${r}`} className="py-2 px-1">
                    <span className={`text-sm font-bold ${pts > 0 ? 'text-masters-green' : 'text-gray-300'}`}>
                      {pts} pts
                    </span>
                    {((score.eagles ?? 0) > 0 || (score.holes_in_one ?? 0) > 0 || (score.double_eagles ?? 0) > 0) && (
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        {score.eagles > 0 && `${score.eagles} eagle${score.eagles > 1 ? 's' : ''}`}
                        {score.double_eagles > 0 && ` ${score.double_eagles} albatross`}
                        {score.holes_in_one > 0 && ` ${score.holes_in_one} ace`}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="py-2 px-1 text-sm font-bold text-masters-green">
                {expanded.result?.tournament_points ?? 0} pts
              </div>
              <div className="py-2 px-1 text-sm font-bold text-masters-gold bg-masters-green/5">
                {expanded.result?.total_points ?? 0} pts
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
