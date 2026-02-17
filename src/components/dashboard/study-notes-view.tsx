'use client';

import { useState } from 'react';
import { generateStudyNotes } from '@/app/actions/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudyNotesView() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotes(null);

        try {
            const result = await generateStudyNotes(url);
            if (result.error) {
                setError(result.error);
            } else {
                setNotes(result.notes || 'No notes generated.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        AI Study Notes Generator
                    </CardTitle>
                    <CardDescription>
                        Paste a YouTube video link below to generate summary notes, key concepts, and a quiz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Notes'
                            )}
                        </Button>
                    </form>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {notes && (
                <Card className="animate-in fade-in-50 duration-500">
                    <CardHeader>
                        <CardTitle>Generated Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
