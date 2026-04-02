import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuService } from 'src/menu/menu.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    private readonly menuService: MenuService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    await this.menuService.findOne(createReviewDto.item);
    const createdReview = new this.reviewModel({ ...createReviewDto, userId });
    return createdReview.save();
  }

  findAll(): Promise<Review[]> {
    return this.reviewModel
      .find()
      .populate('user', 'name')
      .populate({ path: 'item', select: 'name' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Review | null> {
    const review = await this.reviewModel
      .findById(id)
      .populate('user', 'name')
      .populate({ path: 'item', select: 'name' })
      .exec();
    if (!review) throw new NotFoundException('Review not found!');
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .populate('user', 'name')
      .populate({ path: 'item', select: 'name' })
      .exec();
    if (!updatedReview) throw new NotFoundException('Review not found!');
    return updatedReview;
  }

  async remove(id: string) {
    const review = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!review) throw new NotFoundException('Review not found!');
    return review;
  }
}
