import { auth, signOut } from '@/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar - desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen p-4">
                <div className="mb-8">
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    <p className="text-xs text-gray-400">v1.0.0</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800">
                        Home
                    </Link>
                    <Link href="/dashboard/study-notes" className="block px-4 py-2 rounded hover:bg-gray-800">
                        AI Study Notes
                    </Link>
                    <Link href="/dashboard/documents" className="block px-4 py-2 rounded hover:bg-gray-800">
                        Documents (Legacy)
                    </Link>
                    <Link href="/dashboard/workspaces" className="block px-4 py-2 rounded hover:bg-gray-800 text-blue-400 font-medium">
                        Workspaces (New)
                    </Link>
                </nav>

                <div className="border-t border-gray-700 pt-4">
                    <div className="px-4 mb-2">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-400">{session.user.email}</p>
                        <p className="text-xs text-blue-400 mt-1 uppercase">{session.user.role}</p>
                    </div>
                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <Button variant="destructive" className="w-full justify-start" size="sm">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 text-white">
                <h1 className="font-bold">Admin Dashboard</h1>
                {/* Mobile menu toggle would go here */}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
