import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Order } from 'src/order/entities/order.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  private sign(rawSignature: string): string {
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    if (!secretKey) {
      throw new Error(
        'MOMO_SECRET_KEY is not defined in environment variables',
      );
    }
    return crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  async createMomoPayment(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.paymentStatus !== 'pending') {
      throw new BadRequestException('Order is not in pending status');
    }

    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    const endpoint = this.configService.get<string>('MOMO_ENDPOINT');
    const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL');
    const ipnUrl = this.configService.get<string>('MOMO_IPN_URL');
    const requestType =
      this.configService.get<string>('MOMO_REQUEST_TYPE') || 'captureWallet';

    if (!partnerCode || !accessKey || !endpoint || !redirectUrl || !ipnUrl) {
      throw new InternalServerErrorException('Missing MoMo config');
    }

    const momoOrderId = `ORDER_${order._id}_${Date.now()}`;
    const requestId = `REQ_${order._id}_${Date.now()}`;
    const amount = order.total;
    const orderInfo = `Thanh toan don hang ${order._id}`;
    const extraData = Buffer.from(
      JSON.stringify({ internalOrderId: String(order._id) }),
    ).toString('base64');

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;
  }
}
