import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <!-- Page Hero Header -->
      <section class="page-header">
        <div class="container text-center">
          <span class="section-eyebrow">Our Ethos & Origin</span>
          <h1 class="page-title">The Story of The Croppers</h1>
          <p class="page-subtitle">
            A contemporary grooming and styling destination rooted in Jabalpur, Madhya Pradesh.
          </p>
        </div>
      </section>

      <!-- Main Story Section -->
      <section class="section story-section">
        <div class="container story-grid">
          <div class="story-text">
            <span class="section-eyebrow">A Vision for Jabalpur</span>
            <h2 class="section-title">The Art of Deliberate Grooming</h2>
            <p>
              The Croppers was conceived with a clear principle: salon appointments should be an unhurried, restorative personal ritual rather than an assembly-line transaction.
            </p>
            <p>
              Located in the heart of Jabalpur, Madhya Pradesh, we offer a dedicated sanctuary where clients experience focused attention, surgical tool hygiene, and thoughtful consultation before a single blade touches hair.
            </p>
            <p>
              Whether it is a classic taper fade, dimensional colour processing, or a soothing straight-razor shave, our commitment remains uncompromising craft and personalized distinction.
            </p>

            <div class="story-quote">
              <blockquote>
                "True style is not about following fleeting trends—it is about discovering the proportions and textures that belong inherently to you."
              </blockquote>
            </div>
          </div>

          <div class="story-pillars">
            <div class="croppers-card pillar-card">
              <div class="pillar-num">01</div>
              <h3 class="pillar-title">Disciplined Hygiene</h3>
              <p class="pillar-desc">
                Every pair of shears, clipper blade, and comb undergoes multi-stage medical-grade sanitation between guests. Single-use towels and draped neck strips are non-negotiable standards.
              </p>
            </div>

            <div class="croppers-card pillar-card">
              <div class="pillar-num">02</div>
              <h3 class="pillar-title">Honest Consultation</h3>
              <p class="pillar-desc">
                We believe in listening first. Every appointment begins with an analysis of your hair texture, growth patterns, lifestyle demands, and styling preferences.
              </p>
            </div>

            <div class="croppers-card pillar-card">
              <div class="pillar-num">03</div>
              <h3 class="pillar-title">Protected Time</h3>
              <p class="pillar-desc">
                By operating on an automated 30-minute capacity booking grid, we honor your time. Your chair is reserved, minimizing waiting times and preventing overcrowded stations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Location Context & Visiting Us -->
      <section class="section info-section">
        <div class="container">
          <div class="croppers-card visit-card">
            <div class="visit-grid">
              <div class="visit-details">
                <span class="section-eyebrow">Visit The Salon</span>
                <h3 class="visit-title">Located in Jabalpur, Madhya Pradesh</h3>
                <p>
                  Conveniently situated in Jabalpur with dedicated client parking nearby. We welcome both pre-booked appointments and walk-ins based on daily capacity.
                </p>
                <div class="visit-contact-line">
                  <strong>Direct Inquiries:</strong>
                  <a href="tel:+917848827245">+91 78488 27245</a>
                </div>
              </div>
              <div class="visit-action">
                <a routerLink="/book" class="btn btn-primary btn-lg">
                  Book Your Chair
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './about.component.css'
})
export class AboutComponent {}
