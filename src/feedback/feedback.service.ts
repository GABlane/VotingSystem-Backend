import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  async submit(projectId: string, userId: string, dto: CreateFeedbackDto) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, is_active')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    const { data: existing } = await supabase
      .from('feedback')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new ConflictException('You have already submitted feedback for this project');
    }

    const { error } = await supabase
      .from('feedback')
      .insert({ project_id: projectId, user_id: userId, comment: dto.comment });

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('You have already submitted feedback for this project');
      }
      throw new InternalServerErrorException('Failed to submit feedback');
    }

    return { message: 'Feedback submitted successfully' };
  }

  async getForProject(projectId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('id, comment, created_at, user_id, users(email)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Failed to fetch feedback');
    }

    return data.map((f: any) => ({
      id: f.id,
      comment: f.comment,
      created_at: f.created_at,
      user_email: f.users?.email ?? 'Unknown',
    }));
  }
}
