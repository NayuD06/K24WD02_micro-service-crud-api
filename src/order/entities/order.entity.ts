import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Menu } from 'src/menu/entities/menu.entity';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true, collection: 'menus' })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name })
  user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Menu.name })
  item: Types.ObjectId;
  @Prop()
  total: number;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
