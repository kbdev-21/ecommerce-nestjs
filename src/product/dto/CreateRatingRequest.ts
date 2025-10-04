import { IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateRatingRequest {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  comment: string;
}