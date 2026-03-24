import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './entities/category.entity';
import { Model } from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}
  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }
  findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }
  findOne(id: string): Promise<Category | null> {
    const category = this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found!');
    return category;
  }
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();
    if (!updatedCategory) throw new NotFoundException('Category not found!');
    return updatedCategory;
  }
  remove(id: string) {
    const category = this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) throw new NotFoundException('Category not found!');
    return category;
  }
}
