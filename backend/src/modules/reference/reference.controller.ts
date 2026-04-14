import { Controller, Get, Version } from '@nestjs/common';
import { ReferenceService } from './reference.service';

@Controller('reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Version('1')
  @Get('categories')
  async getCategories() {
    return this.referenceService.getCategories();
  }
}
