export interface UpdateConfigDto {
  businessName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  businessPhone?: string | null;
  businessAddress?: string | null;
  currency?: string;
  currencySymbol?: string;
  taxPercentage?: number;
  usesCredit?: boolean;
  usesFood?: boolean;
  usesCashRegister?: boolean;
  usesWhatsapp?: boolean;
  usesReports?: boolean;
  usesTicketsPdf?: boolean;
  requiresOpeningAmount?: boolean;
}

export function validateUpdateConfigDto(body: Record<string, unknown>): UpdateConfigDto {
  const dto: UpdateConfigDto = {};
  const stringFields: Array<[string, keyof UpdateConfigDto]> = [
    ['businessName', 'businessName'],
    ['primaryColor', 'primaryColor'],
    ['secondaryColor', 'secondaryColor'],
    ['currency', 'currency'],
    ['currencySymbol', 'currencySymbol'],
  ];
  const nullableStringFields: Array<[string, keyof UpdateConfigDto]> = [
    ['logoUrl', 'logoUrl'],
    ['businessPhone', 'businessPhone'],
    ['businessAddress', 'businessAddress'],
  ];
  const boolFields: Array<[string, keyof UpdateConfigDto]> = [
    ['usesCredit', 'usesCredit'],
    ['usesFood', 'usesFood'],
    ['usesCashRegister', 'usesCashRegister'],
    ['usesWhatsapp', 'usesWhatsapp'],
    ['usesReports', 'usesReports'],
    ['usesTicketsPdf', 'usesTicketsPdf'],
    ['requiresOpeningAmount', 'requiresOpeningAmount'],
  ];

  for (const [key, prop] of stringFields) {
    if (key in body && typeof body[key] === 'string') {
      (dto as Record<string, unknown>)[prop] = body[key];
    }
  }
  for (const [key, prop] of nullableStringFields) {
    if (key in body) {
      (dto as Record<string, unknown>)[prop] = body[key] === null ? null : String(body[key]);
    }
  }
  for (const [key, prop] of boolFields) {
    if (key in body && typeof body[key] === 'boolean') {
      (dto as Record<string, unknown>)[prop] = body[key];
    }
  }
  if ('taxPercentage' in body && typeof body.taxPercentage === 'number') {
    dto.taxPercentage = body.taxPercentage;
  }

  return dto;
}
