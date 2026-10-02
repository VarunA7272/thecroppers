export interface Salon {
  id: string;
  name: string;
  phone: string;
  city: string;
  state?: string;
  country?: string;
  slug?: string;
  timezone: string;
  currency: string;
  openingHours?: SalonOpeningHour[];
}

export interface SalonOpeningHour {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}
