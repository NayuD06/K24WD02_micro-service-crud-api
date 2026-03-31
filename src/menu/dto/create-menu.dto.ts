import { IsMongoId, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @Length(2, 50)
  readonly name: string;
  @IsNumber()
  @Min(0)
  @Max(100000, { message: 'Please input less than $100,000' })
  readonly price: number;
  @IsMongoId()
  readonly category: string;
}
