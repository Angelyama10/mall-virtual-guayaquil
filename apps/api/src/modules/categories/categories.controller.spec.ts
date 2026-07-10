import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: {
    findPublicCategories: jest.Mock;
    findAllForAdmin: jest.Mock;
    findPublicCategoryBySlug: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    categoriesService = {
      findPublicCategories: jest.fn(),
      findAllForAdmin: jest.fn(),
      findPublicCategoryBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates category creation to CategoriesService', () => {
    const dto = {
      name: 'Ropa',
    };

    controller.create(dto);

    expect(categoriesService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates category update to CategoriesService', () => {
    const dto = {
      isActive: false,
    };

    controller.update('category-1', dto);

    expect(categoriesService.update).toHaveBeenCalledWith('category-1', dto);
  });
});
