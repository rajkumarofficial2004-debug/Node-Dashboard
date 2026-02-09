'use client';

import { Status } from '@prisma/client';
import { updateUserStatus } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransition } from 'react';

type User = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: Status;
    createdAt: Date;
};

export default function AdminView({ users }: { users: User[] }) {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.status === 'PENDING').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        Approve or reject new user registrations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name || 'No Name'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
                                        <Badge variant={user.status === 'APPROVED' ? 'default' : user.status === 'REJECTED' ? 'destructive' : 'outline'}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                </div>
                                <UserActions user={user} />
                            </div>
                        ))}
                        {users.length === 0 && <p className="text-muted-foreground">No users found.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function UserActions({ user }: { user: User }) {
    const [isPending, startTransition] = useTransition();

    if (user.role === 'ADMIN') return null;

    const handleStatusChange = (status: Status) => {
        startTransition(async () => {
            await updateUserStatus(user.id, status);
        });
    };

    return (
        <div className="flex items-center gap-2">
            {user.status === 'PENDING' && (
                <>
                    <Button size="sm" onClick={() => handleStatusChange('APPROVED')} disabled={isPending}>
                        Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange('REJECTED')} disabled={isPending}>
                        Reject
                    </Button>
                </>
            )}
            {user.status === 'APPROVED' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('REJECTED')} disabled={isPending}>
                    Deactivate
                </Button>
            )}
            {user.status === 'REJECTED' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('APPROVED')} disabled={isPending}>
                    Reactivate
                </Button>
            )}
        </div>
    );
}
