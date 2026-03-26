import { IsString, IsNotEmpty } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty()
  fingerprintData: string;
}
