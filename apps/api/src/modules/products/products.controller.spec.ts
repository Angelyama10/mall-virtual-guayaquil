import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: {
    findPublicProducts: jest.Mock;
    findMyProducts: jest.Mock;
    findPublicProductBySlug: jest.Mock;
    createProduct: jest.Mock;
  };

  beforeEach(async () => {
    productsService = {
      findPublicProducts: jest.fn(),
      findMyProducts: jest.fn(),
      findPublicProductBySlug: jest.fn(),
      createProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates public product listing to ProductsService', () => {
    controller.findPublicProducts();

    expect(productsService.findPublicProducts).toHaveBeenCalled();
  });

  it('delegates merchant product listing to ProductsService', () => {
    controller.findMyProducts({
      id: 'user-1',
      email: 'merchant@example.com',
      role: 'MERCHANT',
    });

    expect(productsService.findMyProducts).toHaveBeenCalledWith('user-1');
  });

  it('delegates public product lookup to ProductsService', () => {
    controller.findPublicProductBySlug('zapato-deportivo');

    expect(productsService.findPublicProductBySlug).toHaveBeenCalledWith(
      'zapato-deportivo',
    );
  });

  it('delegates product creation to ProductsService', () => {
    const dto = {
      storeId: 'store-1',
      categoryId: 'category-1',
      name: 'Zapato deportivo',
      basePrice: 59.99,
    };

    controller.createProduct(
      {
        id: 'user-1',
        email: 'merchant@example.com',
        role: 'MERCHANT',
      },
      dto,
    );

    expect(productsService.createProduct).toHaveBeenCalledWith('user-1', dto);
  });
});
