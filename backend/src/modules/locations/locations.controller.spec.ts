import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: jest.Mocked<LocationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: {
            getProvinces: jest.fn(),
            getCities: jest.fn(),
            getBarangays: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get(LocationsService);
  });

  it('returns provinces from the service', async () => {
    service.getProvinces.mockResolvedValue([
      { code: '1', name: 'Test Province' },
    ]);

    await expect(controller.getProvinces()).resolves.toEqual([
      { code: '1', name: 'Test Province' },
    ]);
  });

  it('passes province code to the cities lookup', async () => {
    service.getCities.mockResolvedValue([{ code: '2', name: 'Test City' }]);

    await expect(controller.getCities('0402100000')).resolves.toEqual([
      { code: '2', name: 'Test City' },
    ]);
    expect(service.getCities).toHaveBeenCalledWith('0402100000');
  });

  it('passes city code to the barangays lookup', async () => {
    service.getBarangays.mockResolvedValue([
      { code: '3', name: 'Test Barangay' },
    ]);

    await expect(controller.getBarangays('1380600000')).resolves.toEqual([
      { code: '3', name: 'Test Barangay' },
    ]);
    expect(service.getBarangays).toHaveBeenCalledWith('1380600000');
  });
});
