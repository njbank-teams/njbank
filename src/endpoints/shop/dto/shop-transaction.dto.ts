import { ApiProperty } from '@nestjs/swagger/dist/decorators';
import {
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';

export class ShopTransactionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'U-hinanoaira', description: 'NeosユーザーID' })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'HinaSense', description: 'ショップの名前' })
  shopName: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 100, description: '金額' })
  amount: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'ショップに通知を行う',
    default: false,
    required: false,
  })
  shopAnnounce: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'ユーザーに通知を行う',
    default: false,
    required: false,
  })
  userAnnounce: boolean;
}