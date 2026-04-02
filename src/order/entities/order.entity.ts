import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Menu } from 'src/menu/entities/menu.entity';

export type PaymentStatus = 'pending' | 'completed' | 'failed';
@Schema({ timestamps: true, collection: 'orders' })
export class Order extends Document {
  @Prop()
  user: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: Menu.name }], required: true })
  item: Types.ObjectId[];
  @Prop()
  total: number;
  @Prop({ default: 'cash' })
  paymentMethod: 'cash' | 'momo';
  @Prop({ default: 'pending' })
  paymentStatus: PaymentStatus;
  @Prop()
  momoOrderId?: string;
  @Prop()
  momoRequestId?: string;
  @Prop()
  momoTransactionId?: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
