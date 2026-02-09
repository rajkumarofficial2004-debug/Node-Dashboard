'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Status } from '@prisma/client';

export async function getUsers() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users.');
    }
}

export async function updateUserStatus(userId: string, newStatus: Status) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { message: 'Unauthorized' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
        });
        revalidatePath('/dashboard');
        return { message: `User status updated to ${newStatus}` };
    } catch (error) {
        return { message: 'Database Error: Failed to update status.' };
    }
}
