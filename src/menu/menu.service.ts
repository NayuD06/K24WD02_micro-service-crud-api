import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Menu } from './entities/menu.entity';
import { Model } from 'mongoose';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<Menu>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    await this.categoryService.findOne(createMenuDto.category);

    try {
      const createdMenu = new this.menuModel(createMenuDto);
      const menu = await createdMenu.save();
      return menu.populate('category', 'name');
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Menu name must be unique! Value already exists.',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().populate('category', 'name').exec();
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuModel.findById(id).populate('category', 'name').exec();
    if (!menu) throw new NotFoundException('Menu not found!');
    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const updatedMenu = await this.menuModel
      .findByIdAndUpdate(id, updateMenuDto, { new: true })
      .exec();
    if (!updatedMenu) throw new NotFoundException('Menu not found!');
    return updatedMenu;
  }

  async remove(id: string): Promise<Menu> {
    const menu = await this.menuModel.findByIdAndDelete(id).exec();
    if (!menu) throw new NotFoundException('Menu not found!');
    return menu;
  }
}
