import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Admin only - Create project
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  // Public - List all active projects
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // Public - Get single project
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // Admin only - Update project
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  // Admin only - Delete project
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // Public - Get voting results
  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.projectsService.getResults(id);
  }

  // Admin only - Download printable QR code
  @Get(':id/qr/print')
  @UseGuards(JwtAuthGuard)
  async getPrintableQR(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.projectsService.getPrintableQR(id);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="project-${id}-qr.png"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  // Admin only - Upload project logo
  @Post(':id/upload-logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, cb) => {
        // Only accept images
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.uploadLogo(id, file);
  }
}
