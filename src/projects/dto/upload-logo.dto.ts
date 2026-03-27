import { IsNotEmpty } from 'class-validator';

export class UploadLogoDto {
  @IsNotEmpty()
  file: Express.Multer.File;
}
