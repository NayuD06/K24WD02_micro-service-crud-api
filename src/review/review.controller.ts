import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ensureRole, getUserId, JwtGuard } from 'src/auth/jwt.guard';
import { get } from 'axios';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
  @Get()
  findAll() {
    return this.reviewService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }
  private async loadAndAuthorize(req: any, id: string) {
    const review = await this.reviewService.findOne(id);
    if (review?.userId !== getUserId(req)) {
      ensureRole(req, 'admin'); // Allow admins to access any review
    }
    return review;
  }
  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto, getUserId(req));
  }
  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    await this.loadAndAuthorize(req, id);
    return this.reviewService.update(id, updateReviewDto);
  }
  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.loadAndAuthorize(req, id);
    return this.reviewService.remove(id);
  }
}
