import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { UserJwtAuthGuard } from '../common/guards/user-jwt-auth.guard';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':projectId')
  @UseGuards(UserJwtAuthGuard)
  castVote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.castVote(projectId, req.user.userId, req);
  }

  @Get(':projectId/check')
  @UseGuards(UserJwtAuthGuard)
  checkIfVoted(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.checkIfVoted(projectId, req.user.userId);
  }
}
