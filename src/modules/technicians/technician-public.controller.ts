import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TechnicianSessionDto, TechnicianSignupDto } from './technician.dto';
import { TechniciansService } from './technicians.service';

@ApiTags('technician-public')
@Controller()
export class TechnicianPublicController {
  constructor(private readonly technicians: TechniciansService) {}

  @Post('technician/register')
  register(@Body() dto: TechnicianSignupDto) {
    return this.technicians.signup(dto);
  }

  @Post('technician/session')
  session(@Body() dto: TechnicianSessionDto) {
    const row = this.technicians.findApprovedByPhone(dto.phone);
    if (!row) {
      throw new UnauthorizedException(
        '승인된 기사만 로그인됩니다 — 가입 후 관리자 승인 또는 데모 전화번호(01099998888) 승인 기사 필요',
      );
    }
    return {
      technicianId: row.id,
      name: row.name,
      baseRegion: row.baseRegion,
    };
  }
}
