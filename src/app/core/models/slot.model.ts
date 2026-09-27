export interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  available: boolean;
}

export interface FormattedSlot extends AvailableSlot {
  displayStart: string;
  displayEnd: string;
  period: 'morning' | 'afternoon' | 'evening';
}
