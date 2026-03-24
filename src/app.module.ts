import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './category/category.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string, {
      dbName: process.env.DB_NAME,
    }),
    ConfigModule.forRoot({ isGlobal: true }),//cache: true nếu dự án lớn
    UsersModule,
    CategoryModule,
    MenuModule,
    OrderModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
