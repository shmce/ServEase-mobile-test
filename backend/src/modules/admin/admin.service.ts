import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT, CATALOG_CLIENT } from '../../database/supabase.module';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { handleSupabaseError } from '../../common/utils/supabase-error.handler';

@Injectable()
export class AdminService {
  constructor(
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
  ) {}

  async updateDocumentStatus(documentId: string, dto: UpdateDocumentStatusDto) {
    //  Strict Validation
    if (dto.status === 'rejected' && (!dto.reject_reason || dto.reject_reason.trim() === '')) {
      throw new BadRequestException('A rejection reason must be provided when rejecting a KYC application.');
    }

    // Check if document exists and retrieve the provider_id
    const { data: document, error: fetchError } = await this.catalogDb
      .from('provider_documents')
      .select('document_id, provider_id, status')
      .eq('document_id', documentId)
      .single();

    if (fetchError) handleSupabaseError(fetchError, 'DocumentFetch');
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const providerId = document.provider_id;

    // Update provider_documents status
    const docUpdatePayload: any = {
      status: dto.status,
      reject_reason: dto.status === 'rejected' ? dto.reject_reason : null,
      reviewed_at: new Date().toISOString(),
    };

    // Include admin ID 
    if (dto.admin_id) {
      docUpdatePayload.reviewed_by = dto.admin_id;
    }

    const { data: updatedDoc, error: updateError } = await this.catalogDb
      .from('provider_documents')
      .update(docUpdatePayload)
      .eq('document_id', documentId)
      .select('document_id, provider_id, status, reviewed_at')
      .single();

    if (updateError) handleSupabaseError(updateError, 'DocumentUpdate');

    // Update provider_profiles verification status
    const { error: profileError } = await this.catalogDb
      .from('provider_profiles')
      .update({ verification_status: dto.status })
      .eq('user_id', providerId);

    if (profileError) {
      console.error(`Error updating provider profile for ${providerId}:`, profileError);
      // Don't throw, just log 
    }

    // 5. Update users table account_status 
    const userStatus = dto.status === 'approved' ? 'active' : 'rejected';
    
    const { error: userError } = await this.identityDb
      .from('users')
      .update({ status: userStatus })
      .eq('id', providerId);

    if (userError) {
      console.error(`Error updating user status for ${providerId}:`, userError);
      // Don't throw, just log
    }

    return {
      status: 'success',
      message: `Document ${dto.status} successfully`,
      data: {
        document_id: updatedDoc.document_id,
        provider_id: updatedDoc.provider_id,
        new_status: updatedDoc.status,
        reviewed_at: updatedDoc.reviewed_at
      }
    };
  }
}