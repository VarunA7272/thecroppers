import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  @Input() revealAnimation: 'fade-up' | 'fade-in' | 'zoom-in' = 'fade-up';
  @Input() revealDelay: number = 0;
  @Input() revealThreshold: number = 0.12;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement as HTMLElement;
    
    // Attach initial reveal class
    nativeEl.classList.add(`reveal-${this.revealAnimation}`);

    if (this.revealDelay > 0) {
      nativeEl.style.transitionDelay = `${this.revealDelay}ms`;
    }

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              nativeEl.classList.add('revealed');
              this.observer?.unobserve(nativeEl);
            }
          }
        },
        {
          threshold: this.revealThreshold,
          rootMargin: '0px 0px -40px 0px'
        }
      );

      this.observer.observe(nativeEl);
    } else {
      // Fallback: immediately show
      nativeEl.classList.add('revealed');
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
