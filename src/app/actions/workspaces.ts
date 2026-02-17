'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createWorkspace(data: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: 'Unauthorized' };
    }

    const name = data.get('name') as string;
    if (!name || !name.trim()) {
        return { error: 'Name is required' };
    }

    try {
        const workspace = await (prisma as any).workspace.create({
            data: {
                name,
                userId: session.user.id,
            },
        });

        revalidatePath('/dashboard/workspaces');
        return { success: true, workspace };
    } catch (error) {
        console.error('Create Workspace Error:', error);
        return { error: 'Failed to create workspace' };
    }
}

export async function getWorkspaces() {
    const session = await auth();
    if (!session?.user) return [];

    return await (prisma as any).workspace.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { documents: true } } }
    });
}

export async function deleteWorkspace(id: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    try {
        await (prisma as any).workspace.delete({
            where: { id, userId: session.user.id },
        });

        revalidatePath('/dashboard/workspaces');
        return { success: true };
    } catch (error) {
        console.error('Delete Workspace Error:', error);
        return { error: 'Failed to delete workspace' };
    }
}
