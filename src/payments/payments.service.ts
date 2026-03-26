import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Order } from 'src/order/entities/order.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OrderService } from 'src/order/order.service';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(Order.name) private readonly orderService: OrderService,
  ) {}

  private sign(rawSignature: string): string {
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    if (!secretKey) {
      throw new Error('MOMO_SECRET_KEY is not defined in environment variables');
    }
    return crypto.createHmac('sha256', secretKey)
  }
}
