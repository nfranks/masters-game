'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, Pencil } from 'lucide-react';

interface LookupResult {
  entry_id: string;
  team_name: string;
  edit_token: string;
  is_editable: boolean;
}

export default function MyTeamPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/entries/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          res.status === 404
            ? 'No entry found for this email address.'
            : data.error ?? 'Something went wrong.'
        );
        return;
      }

      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="max-w-md mx-auto px-4 py-16">
        <Card className="bg-white/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-2xl text-masters-green">
              View Your Team
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Enter the email you used when submitting your team.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); setResult(null); }}
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              {!result && (
                <Button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full bg-masters-green hover:bg-masters-light"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up...</>
                  ) : (
                    'Find My Team'
                  )}
                </Button>
              )}
            </form>

            {result && (
              <div className="mt-6 space-y-4">
                <div className="bg-masters-green/5 border border-masters-green/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Team Found</p>
                  <p className="font-serif font-bold text-xl text-masters-green mt-1">
                    {result.team_name}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={`/team/${result.entry_id}`}>
                    <Button className="w-full bg-masters-green hover:bg-masters-light" size="lg">
                      <Eye className="w-4 h-4 mr-2" />
                      View Team Dashboard
                    </Button>
                  </Link>
                  {result.is_editable && (
                    <Link href={`/team/${result.entry_id}/edit?token=${result.edit_token}`}>
                      <Button variant="outline" className="w-full" size="lg">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit My Picks
                      </Button>
                    </Link>
                  )}
                  {!result.is_editable && (
                    <p className="text-xs text-center text-gray-400">
                      Editing is closed &mdash; the deadline has passed.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
