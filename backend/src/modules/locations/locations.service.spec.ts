import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(() => {
    service = new LocationsService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns normalized provinces with NCR first when PSGC responds with a plain array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        { code: '0402100000', name: 'Cavite' },
        { code: '0300800000', name: 'Bulacan' },
      ],
    });

    await expect(service.getProvinces()).resolves.toEqual([
      { code: '1300000000', name: 'National Capital Region (NCR)' },
      { code: '0300800000', name: 'Bulacan' },
      { code: '0402100000', name: 'Cavite' },
    ]);
  });

  it('returns NCR fallback cities when PSGC lookup fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('boom'));

    const cities = await service.getCities('1300000000');

    expect(cities).toEqual(
      expect.arrayContaining([
        { code: '1380600000', name: 'City of Manila' },
        { code: '1381300000', name: 'Quezon City' },
      ]),
    );
  });

  it('filters Manila barangays by prefix when using NCR-wide barangays feed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { code: '1380600100', name: 'Barangay 10' },
          { code: '1380600200', name: 'Barangay 20' },
          { code: '1381300001', name: 'Not Manila Barangay' },
        ],
      }),
    });

    await expect(service.getBarangays('1380600000')).resolves.toEqual([
      { code: '1380600100', name: 'Barangay 10' },
      { code: '1380600200', name: 'Barangay 20' },
    ]);
  });
});
