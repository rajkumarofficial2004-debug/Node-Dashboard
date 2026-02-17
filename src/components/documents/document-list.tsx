'use client';

import { useState, useCallback } from 'react';
import { uploadDocument, deleteDocument, getDocuments } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Trash2, Upload, File } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';

interface Document {
    id: string;
    title: string;
    type: string;
    createdAt: Date;
    _count: { chunks: number };
}

export default function DocumentList({ initialDocuments }: { initialDocuments: Document[] }) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await uploadDocument(formData);
            if (result.error) {
                setError(result.error);
            } else {
                // Refresh list
                const updatedDocs = await getDocuments();
                setDocuments(updatedDocs);
                (e.target as HTMLFormElement).reset();
            }
        } catch (err) {
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await deleteDocument(id);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (err) {
            setError('Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Document
                    </CardTitle>
                    <CardDescription>
                        Upload PDF or Text files to chat with.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Input
                                name="file"
                                type="file"
                                accept=".pdf,.txt"
                                required
                                disabled={uploading}
                            />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Upload'}
                        </Button>
                    </form>
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <Card key={doc.id} className="relative group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2 truncate">
                                {doc.type === 'PDF' ? <FileText className="h-4 w-4 text-red-500" /> : <File className="h-4 w-4 text-blue-500" />}
                                {doc.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Uploaded {formatDistanceToNow(new Date(doc.createdAt))} ago
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {doc._count.chunks} chunks
                            </p>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={() => handleDelete(doc.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {documents.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No documents uploaded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
