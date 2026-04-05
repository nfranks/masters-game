'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/admin';
  const error = searchParams.get('error');

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-800">Masters Pool Admin</CardTitle>
          <CardDescription>
            Sign in with your Google account to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === 'unauthorized' && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              Your account is not authorized to access the admin dashboard.
            </div>
          )}
          <Button onClick={handleLogin} className="w-full bg-green-700 hover:bg-green-800" size="lg">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
