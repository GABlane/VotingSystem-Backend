import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { FingerprintModule } from '../fingerprint/fingerprint.module';

@Module({
  imports: [FingerprintModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
