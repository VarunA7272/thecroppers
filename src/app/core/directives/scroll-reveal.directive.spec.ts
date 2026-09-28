import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <div appScrollReveal revealAnimation="fade-up" [revealDelay]="150" class="test-target">
      Content
    </div>
  `
})
class TestHostComponent {}

describe('ScrollRevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should attach reveal-fade-up class and transition delay', () => {
    const el = fixture.nativeElement.querySelector('.test-target') as HTMLElement;
    expect(el.classList.contains('reveal-fade-up')).toBe(true);
    expect(el.style.transitionDelay).toBe('150ms');
  });
});
