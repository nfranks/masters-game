'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface Props {
  variant?: 'page' | 'popout';
}

function RulesContent() {
  return (
    <div className="space-y-6">
      {/* Daily Points */}
      <div>
        <h3 className="font-serif font-bold text-lg text-masters-green mb-2">Daily Points</h3>
        <p className="text-xs text-gray-500 mb-3">Earned per golfer, per round</p>
        <div className="space-y-1.5">
          {[
            ['Best Score of Each Round', '5 pts'],
            ['Hole in One', '5 pts'],
            ['Double Eagle (Albatross)', '3 pts'],
            ['Eagle', '1 pt'],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between items-center py-1.5 px-3 rounded bg-gray-50">
              <span className="text-sm text-gray-700">{label}</span>
              <span className="text-sm font-bold text-masters-green">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Points */}
      <div>
        <h3 className="font-serif font-bold text-lg text-masters-green mb-2">Tournament Points</h3>
        <p className="text-xs text-gray-500 mb-3">Awarded at the end of the tournament</p>
        <div className="space-y-1.5">
          {[
            ['Winner', '40 pts'],
            ['Runner-up', '35 pts'],
            ['3rd Place', '30 pts'],
            ['4th Place', '25 pts'],
            ['5th Place', '20 pts'],
            ['6th - 10th', '15 pts'],
            ['11th - 25th', '10 pts'],
            ['Best Round of Tournament', '5 pts'],
            ['Making the Cut', '10 pts'],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between items-center py-1.5 px-3 rounded bg-gray-50">
              <span className="text-sm text-gray-700">{label}</span>
              <span className="text-sm font-bold text-masters-green">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Winner Game */}
      <div>
        <h3 className="font-serif font-bold text-lg text-masters-green mb-2">Daily Winner Game</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Lowest combined team score against par for each round. For example, if you have
            5 players 2 under and 5 players 1 over, then your combined team score would be 5 under.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScoringRulesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl font-bold text-white mb-2">Scoring Rules</h1>
      <p className="text-white/60 mb-8">How points are earned in Masters Madness</p>
      <div className="bg-white/95 rounded-xl p-6 sm:p-8">
        <RulesContent />
      </div>
    </div>
  );
}

export function ScoringRulesPopout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors"
        title="Scoring Rules"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Scoring Rules</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-auto animate-in slide-in-from-top-4 duration-200">
            <div className="sticky top-0 bg-masters-green px-5 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-white">Scoring Rules</h2>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <RulesContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
