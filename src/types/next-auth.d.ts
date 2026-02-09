import { Role, Status } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            role: Role;
            status: Status;
        } & DefaultSession['user'];
    }

    interface AbstractUser {
        role: Role;
        status: Status;
    }

    interface User {
        role: Role;
        status: Status;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: Role;
        status: Status;
    }
}
