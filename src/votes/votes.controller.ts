import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Query,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CastVoteDto } from './dto/cast-vote.dto';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':projectId')
  castVote(
    @Param('projectId') projectId: string,
    @Body() castVoteDto: CastVoteDto,
    @Req() request: any,
  ) {
    return this.votesService.castVote(projectId, castVoteDto, request);
  }

  @Get(':projectId/check')
  checkIfVoted(
    @Param('projectId') projectId: string,
    @Query('fingerprint') fingerprintData: string,
    @Req() request: any,
  ) {
    if (!fingerprintData) {
      return { hasVoted: false };
    }
    return this.votesService.checkIfVoted(projectId, fingerprintData, request);
  }
}
