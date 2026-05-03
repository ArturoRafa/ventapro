export interface BusinessConfig {
  id: number;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessPhone: string | null;
  businessAddress: string | null;
  currency: string;
  currencySymbol: string;
  taxPercentage: number;
  usesCredit: boolean;
  usesFood: boolean;
  usesCashRegister: boolean;
  usesWhatsapp: boolean;
  usesReports: boolean;
  usesTicketsPdf: boolean;
  requiresOpeningAmount: boolean;
}
