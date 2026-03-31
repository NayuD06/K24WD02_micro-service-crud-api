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
import { firstValueFrom } from 'rxjs';
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
    const amount = this.converttoVND(order.total);
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

    const signature = this.sign(rawSignature);
    const payload = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };
    const { data } = await firstValueFrom(
      this.httpService.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }),
    );
    order.momoOrderId = momoOrderId;
    order.momoRequestId = requestId;
    order.paymentStatus = 'pending';
    order.paymentMethod = 'momo';
    // order.paymentStatus = 'completed';
    await order.save();
    return data;
  }

  verifyMomoCallbackSignature(body: any): boolean {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    if (!accessKey) {
      return false;
    }
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${body.amount}` +
      `&extraData=${body.extraData || ''}` +
      `&message=${body.message}` +
      `&orderId=${body.orderId}` +
      `&orderInfo=${body.orderInfo}` +
      `&orderType=${body.orderType}` +
      `&partnerCode=${body.partnerCode}` +
      `&payType=${body.payType}` +
      `&requestId=${body.requestId}` +
      `&responseTime=${body.responseTime}` +
      `&resultCode=${body.resultCode}` +
      `&transId=${body.transId}`;
    const expectedSignature = this.sign(rawSignature);
    return expectedSignature === body.signature;
  }
  async handleMomoIpn(body: any) {
    const isValidSignature = this.verifyMomoCallbackSignature(body);
    if (!isValidSignature) {
      return {resultCode: 13, message: 'Merchant authentication failed.'};
    }
    const order = await this.orderModel.findOne({
      momoOrderId: body.orderId,
      momoRequestId: body.requestId,
    });
    if (!order) {
      return {resultCode: 42, message: 'Invalid orderId or orderId is not found.'};
    }
    const expectedAmount = this.converttoVND(order.total);
    if (Number(expectedAmount) !== Number(body.amount)) {
      console.log('Amount mismatch:', expectedAmount, body.amount);
      return {resultCode: 1, message: 'Amount mismatch.'};
    }
    if (body.resultCode === 0) {
      order.paymentStatus = 'pending';
      order.momoTransactionId = body.transId;
      await order.save();
      return {resultCode: 0, message: 'Successful.'};
    }
    order.paymentStatus = 'failed';
    await order.save();
    return {resultCode: 0, message: 'Received'};
  }

  converttoVND(amount: number): number {
    const rate = Number(process.env.MOMO_CONVERT_RATE);
    return Math.round(Number(amount) * rate);
  }
}
