import { PrismaClient, Role, Status } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
console.log('Seed: URL is', connectionString ? 'Defined' : 'Undefined');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'test@test.com';
    const password = 'Test123@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: Role.ADMIN,
            status: Status.APPROVED,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Admin User',
            role: Role.ADMIN,
            status: Status.APPROVED,
        },
    });

    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
