import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import DocumentList from '@/components/documents/document-list';
import ChatInterface from '@/components/documents/chat-interface';
import { getDocuments } from '@/app/actions/documents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function WorkspaceDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const workspace = await (prisma as any).workspace.findUnique({
        where: {
            id: params.id,
            userId: session.user.id
        },
    });

    if (!workspace) {
        notFound();
    }

    const documents = await getDocuments(workspace.id);

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
                <p className="text-muted-foreground">
                    Upload documents and ask questions within this workspace.
                </p>
            </div>

            <Tabs defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
                <TabsList>
                    <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="flex-1 overflow-auto p-1">
                    <DocumentList initialDocuments={documents as any} workspaceId={workspace.id} />
                </TabsContent>

                <TabsContent value="chat" className="flex-1 overflow-hidden p-1">
                    <div className="h-full">
                        <ChatInterface workspaceId={workspace.id} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
