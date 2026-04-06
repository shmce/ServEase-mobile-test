jest.mock('../auth-session', () => ({
  getStoredAccessToken: jest.fn(async () => null),
  getStoredRefreshToken: jest.fn(async () => null),
  persistAuthSession: jest.fn(async () => undefined),
}));

import { api } from '../apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { available: true } }),
    }) as jest.Mock;
  });

  it('appends GET query params to the request URL', async () => {
    await api.get('/provider/provider-1/availability/check', {
      params: {
        scheduled_at: '2026-04-06T01:00:00.000Z',
        hours_required: 2,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:6000/api/v1/provider/provider-1/availability/check?scheduled_at=2026-04-06T01%3A00%3A00.000Z&hours_required=2',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
