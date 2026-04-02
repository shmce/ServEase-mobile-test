import { Controller, Patch, Param, Body, Version } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Version('2')
  @Patch('documents/status/:id')
  async updateDocumentStatus(
    @Param('id') documentId: string,
    @Body() dto: UpdateDocumentStatusDto
  ) {
    return this.adminService.updateDocumentStatus(documentId, dto);
  }
}

