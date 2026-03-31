import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class VotesService {
  constructor(private usersService: UsersService) {}

  async castVote(projectId: string, userId: string, request: any) {
    // Verify project exists and is active
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, is_active')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    if (!project.is_active) {
      throw new ConflictException('This project is no longer accepting votes');
    }

    // Check user has votes remaining
    const user = await this.usersService.getMe(userId);
    if (user.votes_remaining <= 0) {
      throw new ForbiddenException('You have used all your votes');
    }

    // Check if this user already voted for this project
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      throw new ConflictException('You have already voted for this project');
    }

    // Extract request metadata for audit
    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Cast the vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        project_id: projectId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (voteError) {
      if (voteError.code === '23505') {
        throw new ConflictException('You have already voted for this project');
      }
      throw new InternalServerErrorException('Failed to cast vote');
    }

    // Decrement user's remaining votes
    await this.usersService.decrementVotes(userId);

    // Return updated vote count
    const { data: updatedProject } = await supabase
      .from('projects')
      .select('total_votes')
      .eq('id', projectId)
      .single();

    return {
      message: 'Vote cast successfully',
      vote: {
        id: vote.id,
        voted_at: vote.voted_at,
      },
      total_votes: updatedProject?.total_votes || 0,
    };
  }

  async checkIfVoted(
    projectId: string,
    userId: string,
  ): Promise<{ hasVoted: boolean }> {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    return { hasVoted: !!existingVote };
  }
}
