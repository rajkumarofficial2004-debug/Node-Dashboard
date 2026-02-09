'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

export async function registerUser(prevState: any, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Register.',
        };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return {
                message: 'Database Error: User already exists.',
            };
        }

        // First user is ADMIN, others USER.
        // Or just default to USER and let user change later manually in DB for now to bootstrap?
        // "Initial Admin: The first user needs to be an admin" - per plan.
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'USER';
        const status = userCount === 0 ? 'APPROVED' : 'PENDING';

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                status,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create User.',
        };
    }

    redirect('/login');
}
