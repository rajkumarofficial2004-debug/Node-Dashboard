'use client';

import { useActionState } from 'react';
import { registerUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

const initialState = { message: '', errors: {} };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create a new account to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" name="password" required minLength={6} />
            </div>
            <div className="flex items-center justify-between">
              <Link href="/login" className="text-sm text-blue-500 hover:underline">
                Already have an account? Login
              </Link>
            </div>
            {state?.message && (
              <div className="text-red-500 text-sm">{state.message}</div>
            )}
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
