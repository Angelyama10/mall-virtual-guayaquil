import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;
  let cartService: {
    getMyCart: jest.Mock;
    addItem: jest.Mock;
    updateItemQuantity: jest.Mock;
    removeItem: jest.Mock;
    clearCart: jest.Mock;
  };

  beforeEach(async () => {
    cartService = {
      getMyCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: cartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates cart lookup to CartService', () => {
    controller.getMyCart({
      id: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    expect(cartService.getMyCart).toHaveBeenCalledWith('user-1');
  });

  it('delegates item additions to CartService', () => {
    const dto = {
      productId: 'product-1',
      quantity: 2,
    };

    controller.addItem(
      {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      },
      dto,
    );

    expect(cartService.addItem).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates quantity updates to CartService', () => {
    const dto = {
      quantity: 3,
    };

    controller.updateItemQuantity(
      {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      },
      'item-1',
      dto,
    );

    expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
      'user-1',
      'item-1',
      dto,
    );
  });

  it('delegates item removal to CartService', () => {
    controller.removeItem(
      {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      },
      'item-1',
    );

    expect(cartService.removeItem).toHaveBeenCalledWith('user-1', 'item-1');
  });

  it('delegates cart clearing to CartService', () => {
    controller.clearCart({
      id: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    expect(cartService.clearCart).toHaveBeenCalledWith('user-1');
  });
});
