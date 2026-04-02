import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.entity';
import { Model } from 'mongoose';
import { MenuService } from 'src/menu/menu.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private menuService: MenuService,
  ) {}

  async calculatedTotal(itemIds: string[]): Promise<number> {
    let total = 0;
    for (const id of itemIds) {
      const item = await this.menuService.findOne(id);
      total += item.price;
    }
    return total;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    for (const itemId of createOrderDto.item) {
      await this.menuService.findOne(itemId);
    }

    const total = await this.calculatedTotal(createOrderDto.item);
    const order = new this.orderModel({ ...createOrderDto, total });
    return order.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().populate('item').exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('item')
      .exec();
    if (!order) throw new NotFoundException('Order not found!');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    if (dto.item) {
      for (const itemId of dto.item) {
        await this.menuService.findOne(itemId);
      }
    }

    const total = dto.item ? await this.calculatedTotal(dto.item) : undefined;

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { ...dto, ...(total != undefined ? { total } : {}) },
        { new: true },
      )
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
