import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryType } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: {
    findMyOrders: jest.Mock;
    findMyOrder: jest.Mock;
    checkoutFromCart: jest.Mock;
  };

  beforeEach(async () => {
    ordersService = {
      findMyOrders: jest.fn(),
      findMyOrder: jest.fn(),
      checkoutFromCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates order listing to OrdersService', () => {
    controller.findMyOrders({
      id: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    expect(ordersService.findMyOrders).toHaveBeenCalledWith('user-1');
  });

  it('delegates order lookup to OrdersService', () => {
    controller.findMyOrder(
      {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      },
      'order-1',
    );

    expect(ordersService.findMyOrder).toHaveBeenCalledWith('user-1', 'order-1');
  });

  it('delegates checkout to OrdersService', () => {
    const dto = {
      deliveryType: DeliveryType.HOME_DELIVERY,
      notes: 'Entregar en recepcion',
    };

    controller.checkout(
      {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      },
      dto,
    );

    expect(ordersService.checkoutFromCart).toHaveBeenCalledWith('user-1', dto);
  });
});
