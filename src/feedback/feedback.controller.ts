import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UserJwtAuthGuard } from '../common/guards/user-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Any logged-in user can submit feedback (no vote required)
  @Post(':projectId')
  @UseGuards(UserJwtAuthGuard)
  submit(
    @Param('projectId') projectId: string,
    @Body() dto: CreateFeedbackDto,
    @Req() req: any,
  ) {
    return this.feedbackService.submit(projectId, req.user.userId, dto);
  }

  // Only admins can read feedback
  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  getForProject(@Param('projectId') projectId: string) {
    return this.feedbackService.getForProject(projectId);
  }
}
