import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';
import { SalonService } from '../models/service.model';

describe('BookingService (Multi-Service Support)', () => {
  let service: BookingService;

  const mockService1: SalonService = {
    id: 'srv-1',
    salon_id: 'the-croppers-jbp',
    category_name: 'Hair',
    name: 'Signature Haircut',
    description: 'Precision cut',
    duration_minutes: 30,
    price: 250,
    is_active: true
  };

  const mockService2: SalonService = {
    id: 'srv-2',
    salon_id: 'the-croppers-jbp',
    category_name: 'Beard',
    name: 'Beard Sculpting',
    description: 'Razor lines',
    duration_minutes: 20,
    price: 150,
    is_active: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingService);
    service.resetBooking();
  });

  it('should initialize with empty selected services', () => {
    expect(service.selectedServices().length).toBe(0);
    expect(service.isServiceSelected()).toBe(false);
    expect(service.totalDuration()).toBe(0);
    expect(service.totalPrice()).toBe(0);
  });

  it('should allow toggling multiple services and accurately calculate totals', () => {
    service.toggleService(mockService1);
    expect(service.isServiceInCart('srv-1')).toBe(true);
    expect(service.selectedServices().length).toBe(1);
    expect(service.totalDuration()).toBe(30);
    expect(service.totalPrice()).toBe(250);

    // Add second service
    service.toggleService(mockService2);
    expect(service.isServiceInCart('srv-2')).toBe(true);
    expect(service.selectedServices().length).toBe(2);
    expect(service.totalDuration()).toBe(50);
    expect(service.totalPrice()).toBe(400);
    expect(service.selectedServiceNames()).toBe('Signature Haircut + Beard Sculpting');

    // Deselect first service
    service.toggleService(mockService1);
    expect(service.isServiceInCart('srv-1')).toBe(false);
    expect(service.selectedServices().length).toBe(1);
    expect(service.totalDuration()).toBe(20);
    expect(service.totalPrice()).toBe(150);
  });

  it('should calculate slot end time dynamically based on total duration', () => {
    service.toggleService(mockService1); // 30m
    service.toggleService(mockService2); // 20m -> total 50m

    service.selectSlot({
      slot_start: '10:00:00',
      slot_end: '10:30:00',
      available: true
    });

    expect(service.state().slotStart).toBe('10:00:00');
    expect(service.state().slotEnd).toBe('10:50:00');
  });

  it('should accurately calculate end times using calculateEndTime', () => {
    expect(service.calculateEndTime('10:00:00', 45)).toBe('10:45:00');
    expect(service.calculateEndTime('10:30:00', 60)).toBe('11:30:00');
    expect(service.calculateEndTime('11:45:00', 30)).toBe('12:15:00');
  });

  it('should validate readiness when all required fields are complete', () => {
    service.toggleService(mockService1);
    service.selectDate('2026-10-15');
    service.selectSlot({
      slot_start: '14:00:00',
      slot_end: '14:30:00',
      available: true
    });
    service.updateCustomerDetails('Varun Rajore', '9826123456');

    expect(service.isReadyToConfirm()).toBe(true);
  });
});
