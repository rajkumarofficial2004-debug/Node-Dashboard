'use client';

import { useState } from 'react';
import { createWorkspace, deleteWorkspace } from '@/app/actions/workspaces'; // Ensure these are exported from actions
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Folder } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Workspace {
    id: string;
    name: string;
    createdAt: Date;
    _count: {
        documents: number;
    };
}

interface WorkspaceListProps {
    initialWorkspaces: Workspace[];
}

export default function WorkspaceList({ initialWorkspaces }: WorkspaceListProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim() || loading) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('name', newWorkspaceName);

        const result = await createWorkspace(formData);

        if (result.success && result.workspace) {
            setWorkspaces([result.workspace as any, ...workspaces]);
            setNewWorkspaceName('');
            router.refresh(); // Refresh server components
        } else {
            alert('Failed to create workspace');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workspace and all its documents?')) return;

        const result = await deleteWorkspace(id);
        if (result.success) {
            setWorkspaces(workspaces.filter(w => w.id !== id));
            router.refresh();
        } else {
            alert('Failed to delete workspace');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Workspace</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="flex gap-4">
                        <Input
                            placeholder="Workspace Name (e.g., 'Project Alpha')"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading || !newWorkspaceName.trim()}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Create
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                    <Card key={workspace.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                <Link href={`/dashboard/workspaces/${workspace.id}`} className="hover:underline flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-primary" />
                                    {workspace.name}
                                </Link>
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(workspace.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{workspace._count?.documents || 0}</div>
                            <p className="text-xs text-muted-foreground">Documents</p>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/dashboard/workspaces/${workspace.id}`} className="w-full">
                                <Button variant="secondary" className="w-full">Open Workspace</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {workspaces.length === 0 && (
                    <div className="col-span-full text-center p-8 text-muted-foreground">
                        No workspaces found. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
