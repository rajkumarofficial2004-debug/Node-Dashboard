import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserView({ user }: { user: any }) {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Welcome back, {user.name || 'User'}!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Your account status is currently <strong>{user.status}</strong>.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Access to premium features will be enabled once your admin grants additional permissions explicitly if needed.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
