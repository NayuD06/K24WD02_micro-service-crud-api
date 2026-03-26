import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.entity';
import { MenuService } from 'src/menu/menu.service';
import { UsersService } from 'src/users/users.service';
import { Menu } from 'src/menu/entities/menu.entity';

@Injectable()
export class OrderService {
  findById(orderId: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    private readonly menuService: MenuService,
    private readonly userService: UsersService,
  ) {}
  async caculatedTotal(itemIds: string[]): Promise<number>  {
      const items = await this.menuModel.find({ _id: { $in: itemIds } }).exec();
      return items.reduce((total, menuItem) => total + menuItem.price, 0);
    
  }
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.userService.findOne(createOrderDto.user);
    for (const itemId of createOrderDto.item) {
      await this.menuService.findOne(itemId);
    }
    const total = await this.caculatedTotal(createOrderDto.item);
    const order = new this.orderModel({
      ...createOrderDto,
      total,
    });
    return order.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().populate('user').populate('item').exec();
  }
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('user')
      .populate('item')
      .exec();
    if (!order) throw new NotFoundException('Order not found!');
    return order;
  }
  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    if (dto.user) {
      await this.userService.findOne(dto.user);
    }
    if (dto.item) {
      for (const itemId of dto.item) {
        await this.menuService.findOne(itemId);
      }
    }
    const total = dto.item ? await this.caculatedTotal(dto.item) : undefined;
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { ...dto, ...(total != undefined ? { total } : {}) },
        { new: true },
      )
      .populate('user')
      .populate('item')
      .exec();
    if (!updatedOrder) throw new NotFoundException('Order not found!');
    return updatedOrder;
  }
  async remove(id: string): Promise<Order> {
    const order = await this.orderModel.findByIdAndDelete(id).exec();
    if (!order) throw new NotFoundException('Order not found!');
    return order;
  }
}
