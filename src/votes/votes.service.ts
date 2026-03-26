import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { FingerprintService } from '../fingerprint/fingerprint.service';
import { CastVoteDto } from './dto/cast-vote.dto';

@Injectable()
export class VotesService {
  constructor(private fingerprintService: FingerprintService) {}

  async castVote(
    projectId: string,
    castVoteDto: CastVoteDto,
    request: any,
  ) {
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

    // Extract IP and user agent
    const ipAddress = this.fingerprintService.extractIpAddress(request);
    const userAgent = this.fingerprintService.extractUserAgent(request);

    // Generate fingerprint hash
    const fingerprintHash = this.fingerprintService.generateHash(
      castVoteDto.fingerprintData,
      ipAddress,
    );

    // Check if this fingerprint has already voted for this project
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('fingerprint_hash', fingerprintHash)
      .single();

    if (existingVote) {
      throw new ConflictException('You have already voted for this project');
    }

    // Cast the vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        project_id: projectId,
        fingerprint_hash: fingerprintHash,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (voteError) {
      // Check if it's a unique constraint violation
      if (voteError.code === '23505') {
        throw new ConflictException('You have already voted for this project');
      }
      throw new InternalServerErrorException('Failed to cast vote');
    }

    // Get updated vote count
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
    fingerprintData: string,
    request: any,
  ): Promise<{ hasVoted: boolean }> {
    // Extract IP
    const ipAddress = this.fingerprintService.extractIpAddress(request);

    // Generate fingerprint hash
    const fingerprintHash = this.fingerprintService.generateHash(
      fingerprintData,
      ipAddress,
    );

    // Check if vote exists
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('fingerprint_hash', fingerprintHash)
      .single();

    return {
      hasVoted: !!existingVote,
    };
  }
}
