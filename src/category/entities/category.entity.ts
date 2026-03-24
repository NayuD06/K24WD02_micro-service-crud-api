import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({timestamps: true, collection: 'categories'})
export class Category extends Document {
  @Prop({ required: true, unique: true, sparse: true, lowercase: true })
  name: string;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ name: 1 }, { unique: true, sparse: true });

