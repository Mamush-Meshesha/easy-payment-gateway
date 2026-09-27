import { IsNotEmpty, IsString, MaxLength, IsUrl, IsEnum, IsOptional } from 'class-validator';

export class CreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  legalName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  displayName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  country!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  defaultCurrency!: string;

  @IsNotEmpty()
  @IsString()
  ownerEmail!: string;
}

export class GenerateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['TEST', 'LIVE'])
  environment?: 'TEST' | 'LIVE' = 'LIVE';

  @IsOptional()
  @IsEnum(['SECRET', 'PUBLISHABLE'])
  keyType?: 'SECRET' | 'PUBLISHABLE' = 'SECRET';
}

export class CreateWebhookConfigDto {
  @IsNotEmpty({ message: 'Webhook URL is required' })
  @IsUrl({ require_tld: false }, { message: 'Must be a valid URL' })
  url!: string;

  @IsOptional()
  events?: string[];

  @IsOptional()
  isActive?: boolean;
}
