import { NotFoundException } from '@nestjs/common';
import { getMaybeSingle, getResult } from './database.utils';

describe('database.utils', () => {
  it('returns data from a successful response', async () => {
    await expect(
      getResult(
        Promise.resolve({
          data: { id: '1' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK',
        }),
      ),
    ).resolves.toEqual({ id: '1' });
  });

  it('returns an empty array when allowEmpty is enabled', async () => {
    await expect(
      getResult(
        Promise.resolve({
          data: [],
          error: null,
          count: null,
          status: 200,
          statusText: 'OK',
        }),
        'Database',
        { allowEmpty: true },
      ),
    ).resolves.toEqual([]);
  });

  it('throws not found when empty data is not allowed', async () => {
    await expect(
      getResult(
        Promise.resolve({
          data: null,
          error: null,
          count: null,
          status: 200,
          statusText: 'OK',
        }),
        'Lookup',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns nullable data from maybeSingle responses', async () => {
    await expect(
      getMaybeSingle(
        Promise.resolve({
          data: null,
          error: null,
          count: null,
          status: 200,
          statusText: 'OK',
        }),
      ),
    ).resolves.toBeNull();
  });
});
