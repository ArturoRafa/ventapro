import { AppDataSource } from '../config/database';
import { BusinessConfig } from '../entities/BusinessConfig';
import { UpdateConfigDto } from '../dtos/config.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(BusinessConfig);

export async function getConfig(): Promise<BusinessConfig> {
  const config = await repo().findOne({ where: { id: 1 } });
  if (!config) {
    throw Errors.notFound('Business configuration not found');
  }
  return config;
}

export async function updateConfig(dto: UpdateConfigDto): Promise<BusinessConfig> {
  const config = await getConfig();
  Object.assign(config, dto);
  return repo().save(config);
}
