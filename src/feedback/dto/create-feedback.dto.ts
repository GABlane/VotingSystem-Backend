import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
