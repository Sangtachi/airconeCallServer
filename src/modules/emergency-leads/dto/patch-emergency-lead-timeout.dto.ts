import { IsString, MaxLength, MinLength } from 'class-validator';

export class PatchEmergencyLeadTimeoutDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  clientSessionId!: string;
}
