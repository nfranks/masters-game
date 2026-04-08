'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function MyTeamPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
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

      router.push(`/team/${data.entry_id}`);
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
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full bg-masters-green hover:bg-masters-light"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up...</>
                ) : (
                  'View My Team'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
