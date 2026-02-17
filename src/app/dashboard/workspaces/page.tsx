import { getWorkspaces } from '@/app/actions/workspaces';
import WorkspaceList from '@/components/dashboard/workspace-list';

export default async function WorkspacesPage() {
    const workspaces = await getWorkspaces();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
                <p className="text-muted-foreground">
                    Manage your document collections and collaborate with AI.
                </p>
            </div>

            <WorkspaceList initialWorkspaces={workspaces as any} />
        </div>
    );
}
