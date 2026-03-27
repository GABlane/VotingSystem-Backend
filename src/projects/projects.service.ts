import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { QrService } from '../qr/qr.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private qrService: QrService) {}

  async create(createProjectDto: CreateProjectDto) {
    const { title, description } = createProjectDto;

    // Create project first
    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !project) {
      throw new InternalServerErrorException('Failed to create project');
    }

    // Generate QR code
    try {
      const qrCodeUrl = await this.qrService.generateQRCode(project.id);

      // Update project with QR code URL
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', project.id)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update QR code');
      }

      return updatedProject;
    } catch (error) {
      // If QR generation fails, still return the project
      console.error('QR code generation failed:', error);
      return project;
    }
  }

  async findAll() {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Failed to fetch projects');
    }

    return projects || [];
  }

  async findOne(id: string) {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Check if project exists
    await this.findOne(id);

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateProjectDto)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedProject) {
      throw new InternalServerErrorException('Failed to update project');
    }

    return updatedProject;
  }

  async remove(id: string) {
    // Check if project exists
    await this.findOne(id);

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Failed to delete project');
    }

    return { message: 'Project deleted successfully' };
  }

  async getResults(id: string) {
    // Check if project exists
    const project = await this.findOne(id);

    // Get vote details
    const { data: votes, error } = await supabase
      .from('votes')
      .select('id, voted_at, ip_address')
      .eq('project_id', id)
      .order('voted_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Failed to fetch vote results');
    }

    return {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        total_votes: project.total_votes,
        created_at: project.created_at,
      },
      votes: votes || [],
      vote_count: votes?.length || 0,
    };
  }

  async getPrintableQR(id: string): Promise<Buffer> {
    // Verify project exists
    await this.findOne(id);

    return this.qrService.generatePrintableQR(id);
  }

  async uploadLogo(
    projectId: string,
    file: Express.Multer.File,
  ): Promise<{ logo_url: string }> {
    try {
      // Verify project exists
      await this.findOne(projectId);

      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-logos')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new InternalServerErrorException('Failed to upload logo');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-logos')
        .getPublicUrl(filePath);

      const logo_url = urlData.publicUrl;

      // Update project with logo URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ logo_url })
        .eq('id', projectId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new InternalServerErrorException('Failed to update project');
      }

      return { logo_url };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Logo upload failed');
    }
  }
}
