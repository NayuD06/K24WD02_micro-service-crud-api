import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({timestamps: true, collection: 'menus'})
export class Menu extends Document {
  @Prop({ required: true })
  name: string;
  @Prop()
  price: number;
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category: Types.ObjectId;
}
export const MenuSchema = SchemaFactory.createForClass(Menu);
