import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

describe('StoresController', () => {
  let controller: StoresController;
  let storesService: {
    findPublicStores: jest.Mock;
    findMyStores: jest.Mock;
    findPublicStoreBySlug: jest.Mock;
    createMerchantProfile: jest.Mock;
    createCompany: jest.Mock;
    createStore: jest.Mock;
  };

  beforeEach(async () => {
    storesService = {
      findPublicStores: jest.fn(),
      findMyStores: jest.fn(),
      findPublicStoreBySlug: jest.fn(),
      createMerchantProfile: jest.fn(),
      createCompany: jest.fn(),
      createStore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: storesService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates merchant profile creation to StoresService', () => {
    const dto = {
      contactEmail: 'merchant@example.com',
      contactPhone: '0999999999',
    };

    controller.createMerchantProfile(
      {
        id: 'user-1',
        email: 'merchant@example.com',
        role: 'MERCHANT',
      },
      dto,
    );

    expect(storesService.createMerchantProfile).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates company creation to StoresService', () => {
    const dto = {
      name: 'Angel Store',
    };

    controller.createCompany(
      {
        id: 'user-1',
        email: 'merchant@example.com',
        role: 'MERCHANT',
      },
      dto,
    );

    expect(storesService.createCompany).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates store creation to StoresService', () => {
    const dto = {
      companyId: 'company-1',
      name: 'Angel Store Centro',
      address: {
        street: 'Av. Principal 123',
        city: 'Guayaquil',
      },
    };

    controller.createStore(
      {
        id: 'user-1',
        email: 'merchant@example.com',
        role: 'MERCHANT',
      },
      dto,
    );

    expect(storesService.createStore).toHaveBeenCalledWith('user-1', dto);
  });
});
