import 'reflect-metadata';
import bcrypt from 'bcryptjs';

import { AppDataSource } from './database';
import { env } from './env';
import { User } from '../entities/User';
import { BusinessConfig } from '../entities/BusinessConfig';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.warn('Database connected for seeding...');

  const userRepo = AppDataSource.getRepository(User);
  const configRepo = AppDataSource.getRepository(BusinessConfig);
  const categoryRepo = AppDataSource.getRepository(Category);
  const subcategoryRepo = AppDataSource.getRepository(Subcategory);

  // Seed admin user
  const existingAdmin = await userRepo.findOne({ where: { email: env.adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    await userRepo.save(
      userRepo.create({
        name: env.adminName,
        email: env.adminEmail,
        passwordHash,
        role: 'admin',
        status: 'activo',
      }),
    );
    console.warn('Admin user created');
  } else {
    console.warn('Admin user already exists, skipping');
  }

  // Seed business config (singleton)
  const existingConfig = await configRepo.findOne({ where: { id: 1 } });
  if (!existingConfig) {
    await configRepo.save(configRepo.create({ businessName: 'Cafeteria El Buen Sabor' }));
    console.warn('Business config created');
  } else {
    console.warn('Business config already exists, skipping');
  }

  // Seed categories
  const categoryCount = await categoryRepo.count();
  if (categoryCount === 0) {
    const categories = await categoryRepo.save([
      categoryRepo.create({ name: 'Bebidas', order: 1 }),
      categoryRepo.create({ name: 'Comidas', order: 2 }),
      categoryRepo.create({ name: 'Snacks', order: 3 }),
      categoryRepo.create({ name: 'Panaderia', order: 4 }),
    ]);
    console.warn(`${categories.length} categories created`);

    // Seed subcategories
    const subcategories = [
      // Bebidas
      { categoryId: categories[0].id, name: 'Cafe caliente', order: 1 },
      { categoryId: categories[0].id, name: 'Cafe frio', order: 2 },
      { categoryId: categories[0].id, name: 'Jugos naturales', order: 3 },
      { categoryId: categories[0].id, name: 'Gaseosas', order: 4 },
      // Comidas
      { categoryId: categories[1].id, name: 'Desayunos', order: 1 },
      { categoryId: categories[1].id, name: 'Almuerzos', order: 2 },
      { categoryId: categories[1].id, name: 'Empanadas', order: 3 },
      { categoryId: categories[1].id, name: 'Hamburguesas', order: 4 },
      // Snacks
      { categoryId: categories[2].id, name: 'Galletas', order: 1 },
      { categoryId: categories[2].id, name: 'Papas', order: 2 },
      { categoryId: categories[2].id, name: 'Dulces', order: 3 },
      // Panaderia
      { categoryId: categories[3].id, name: 'Pan', order: 1 },
      { categoryId: categories[3].id, name: 'Pasteles', order: 2 },
      { categoryId: categories[3].id, name: 'Tortas', order: 3 },
    ];

    const saved = await subcategoryRepo.save(subcategories.map((s) => subcategoryRepo.create(s)));
    console.warn(`${saved.length} subcategories created`);
  } else {
    console.warn('Categories already exist, skipping');
  }

  await AppDataSource.destroy();
  console.warn('Seed completed successfully');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
