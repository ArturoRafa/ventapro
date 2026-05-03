import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

interface UserSummary {
  id: number;
  name: string;
  role: string;
}

export async function getAll(): Promise<UserSummary[]> {
  const repo = AppDataSource.getRepository(User);
  const users = await repo.find({
    where: { status: 'activo' },
    select: ['id', 'name', 'role'],
    order: { name: 'ASC' },
  });
  return users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
}
