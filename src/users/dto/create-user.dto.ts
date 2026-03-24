import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  Length,
  IsPhoneNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(5, 50)
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @Transform(({ value }) => value.replace(/\s+/g, '')) // Loại bỏ tất cả ký tự không phải số
  @IsPhoneNumber('VN')
  readonly phone: string;

  @Type(() => Number)
  @IsInt()
  @Min(18, { message: 'Age must be at least 18' })
  @Max(65, { message: 'Age must be at most 65' })
  readonly age: number;
}
