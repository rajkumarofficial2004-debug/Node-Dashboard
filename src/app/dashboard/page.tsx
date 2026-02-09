import { auth } from '@/auth';
import { getUsers } from '@/app/actions/admin';
import AdminView from '@/components/dashboard/admin-view';
import UserView from '@/components/dashboard/user-view';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role === 'ADMIN') {
        const users = await getUsers();
        return <AdminView users={users} />;
    }

    return <UserView user={session.user} />;
}
