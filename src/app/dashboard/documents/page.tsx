import { Suspense } from 'react';
import DocumentList from '@/components/documents/document-list';
import ChatInterface from '@/components/documents/chat-interface';
import { getDocuments } from '@/app/actions/documents';

export default async function DocumentsPage() {
    const documents = await getDocuments();

    return (
        <div className="space-y-6 h-[calc(100vh-100px)]">
            <h2 className="text-3xl font-bold tracking-tight">Document QA</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column: Document Management */}
                <div className="lg:col-span-1 space-y-6">
                    <DocumentList initialDocuments={documents} />
                </div>

                {/* Right Column: Chat Interface */}
                <div className="lg:col-span-2">
                    <ChatInterface />
                </div>
            </div>
        </div>
    );
}
