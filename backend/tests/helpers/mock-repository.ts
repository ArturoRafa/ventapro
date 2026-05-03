export function createMockQueryBuilder() {
  const qb: Record<string, jest.Mock> = {};
  const chain = [
    'select', 'addSelect', 'where', 'andWhere', 'orWhere',
    'leftJoinAndSelect', 'innerJoin', 'innerJoinAndSelect',
    'groupBy', 'addGroupBy', 'orderBy', 'addOrderBy',
    'skip', 'take', 'limit', 'offset',
    'update', 'set',
  ];
  for (const method of chain) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getRawOne = jest.fn().mockResolvedValue(null);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.execute = jest.fn().mockResolvedValue({ affected: 0 });
  return qb;
}

export function createMockRepository() {
  const qb = createMockQueryBuilder();
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn().mockImplementation((entity: unknown) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((data: unknown) => data),
    count: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    _qb: qb,
  };
}

export function createMockQueryRunner() {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((entity: unknown) => Promise.resolve(entity)),
      create: jest.fn().mockImplementation((_Entity: unknown, data: unknown) => data),
      update: jest.fn(),
      decrement: jest.fn(),
      delete: jest.fn(),
    },
  };
}
