import {
  IsMongoId,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100, { message: 'Please input less than $100' })
  price: number;

  @IsMongoId()
  category: string;
}
