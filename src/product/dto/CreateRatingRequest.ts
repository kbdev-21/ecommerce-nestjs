import { IsNumber, IsString, Max, Min, IsNotEmpty } from 'class-validator';

export class CreateRatingRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  comment: string;
}