import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TechnicianDocumentPresignDto, TechnicianSessionDto, TechnicianSignupDto } from './technician.dto';
import { TechniciansService } from './technicians.service';

@ApiTags('technician-public')
@Controller()
export class TechnicianPublicController {
  constructor(private readonly technicians: TechniciansService) {}

  @Post('technician/register')
  register(@Body() dto: TechnicianSignupDto) {
    return this.technicians.signup(dto);
  }

  @Post('technician/documents/presign')
  presignDocument(@Body() dto: TechnicianDocumentPresignDto) {
    return this.technicians.presignDocumentUpload(dto);
  }

  @Post('technician/session')
  session(@Body() dto: TechnicianSessionDto) {
    const row = this.technicians.findApprovedByCredentials(dto.phone, dto.password);
    if (!row) {
      throw new UnauthorizedException('승인된 기사 계정이 아니거나 전화번호/비밀번호가 맞지 않습니다.');
    }
    return {
      technicianId: row.id,
      name: row.name,
      baseRegion: row.baseRegion,
      status: row.status,
      workStatus: row.workStatus,
    };
  }
}
