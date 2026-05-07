import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-client-worker-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="profile-wrap">

      <!-- Breadcrumb -->
      <nav class="crumb">
        <a routerLink="/client" class="crumb-link">Marketplace</a>
        <span class="crumb-sep">›</span>
        <span>{{ worker()?.name }}</span>
      </nav>

      <!-- Hero banner -->
      <div class="hero">
        <div class="hero-top">
          <div class="hero-top-left">
            <div class="avatar-wrap">
              <div class="avatar">
                @if (worker()?.image) {
                  <img [src]="worker()?.image" alt="{{ worker()?.name }}" class="avatar-img">
                } @else {
                  {{ worker()?.initials }}
                }
              </div>
              <span class="avail-dot"></span>
            </div>
            <div class="hero-identity">
              <h1 class="hero-name">{{ worker()?.name }}</h1>
              <p class="hero-role">{{ worker()?.category }}</p>
              <span class="hero-badge">
                <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#4ade80"/></svg>
                Available now · {{ worker()?.location || 'Location not specified' }}
              </span>
            </div>
          </div>
          <div class="hero-actions">
            <button [disabled]="hasPendingRequest()" 
                    [class.btn-disabled]="hasPendingRequest()"
                    class="btn-hire-hero" (click)="hire()">
              {{ hasPendingRequest() ? 'Request Pending' : 'Hire now' }}
            </button>
            <button class="btn-msg-hero" (click)="message()">Message</button>
          </div>
        </div>

        <div class="hero-stats">
          <div class="h-stat">
            <p class="h-stat-label">Hourly rate</p>
            <p class="h-stat-val accent">\${{ worker()?.rate }}</p>
          </div>
          <div class="h-stat">
            <p class="h-stat-label">Reviews</p>
            <p class="h-stat-val">{{ worker()?.reviews }}</p>
          </div>
          <div class="h-stat">
            <p class="h-stat-label">Success rate</p>
            <p class="h-stat-val">{{ successRate() }}%</p>
          </div>
          <div class="h-stat">
            <p class="h-stat-label">Work records</p>
            <p class="h-stat-val">{{ worker()?.workHistory?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Two-column body -->
      <div class="two-col">

        <!-- Left: main content -->
        <div class="left-col">

          <!-- About -->
          <div class="card">
            <p class="card-label">About</p>
            <p class="bio-text">{{ worker()?.bio }}</p>
            <div class="tags">
              @for (skill of worker()?.skills; track skill) {
                <span class="tag">{{ skill }}</span>
              }
            </div>
          </div>

          <!-- Work history -->
          <div class="card">
            <p class="card-label">Work history</p>

            @for (job of displayHistory(); track $index) {
              <div class="job" [class.first]="$first">
                <div class="job-head">
                  <span class="job-title">{{ job.role }}</span>
                  <span class="job-co">{{ job.company }}</span>
                </div>
                <p class="job-period">{{ job.period }}</p>
                <p class="job-quote">"{{ job.description }}"</p>
              </div>
            }

            <button class="more-btn">View all reviews</button>
          </div>

        </div>

        <!-- Right: sidebar -->
        <div class="right-col">

          <!-- Engagement card -->
          <div class="sidebar-card">
            <p class="s-label">Engagement</p>
            <div class="rate-display">
              <span class="rate-num">\${{ worker()?.rate }}</span>
              <span class="rate-unit">/ hr</span>
            </div>
            <div class="star-row">
              <span class="stars">★★★★★</span>
              <span class="star-meta">{{ worker()?.rating?.toFixed(2) }} · {{ worker()?.reviews }} reviews</span>
            </div>
            <button [disabled]="hasPendingRequest()" 
                    [class.btn-disabled]="hasPendingRequest()"
                    class="btn-hire-full" (click)="hire()">
              {{ hasPendingRequest() ? 'Hiring Pending' : 'Hire ' + (worker()?.name?.split(' ')?.[0] || 'Professional') }}
            </button>
            <button class="btn-msg-full" (click)="message()">
              Send message
            </button>
            <div class="save-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Save to shortlist
            </div>
          </div>

          <!-- Performance -->
          <div class="sidebar-card">
            <p class="s-label">Performance</p>
            @for (m of metrics(); track m.label) {
              <div class="metric">
                <div class="metric-top">
                  <span class="metric-name">{{ m.label }}</span>
                  <span class="metric-pct">{{ m.value }}%</span>
                </div>
                <div class="track">
                  <div class="fill" [style.width.%]="m.value"></div>
                </div>
              </div>
            }
          </div>

          <!-- Certifications -->
          <div class="sidebar-card">
            <p class="s-label">Certifications</p>
            @for (c of displayCerts(); track c.name) {
              <div class="cert-item">
                <div class="cert-dot"></div>
                <div>
                  <p class="cert-name">{{ c.name }}</p>
                  <p class="cert-sub">{{ c.issuer }} · {{ c.year }}</p>
                </div>
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .profile-wrap {
      padding: 4px 0 32px;
    }

    /* ── Breadcrumb ── */
    .crumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 18px;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .crumb-link {
      color: #185FA5;
      text-decoration: none;
      cursor: pointer;
    }
    .crumb-link:hover { text-decoration: underline; }
    .crumb-sep { opacity: .4; }

    /* ── Hero ── */
    .hero {
      background: #fff;
      border: 0.5px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .hero-top {
      background: #0f172a;
      padding: 28px 28px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .hero-top-left {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }
    .avatar-wrap { position: relative; }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 10px;
      background: #1e3a5f;
      color: #93c5fd;
      font-size: 22px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avail-dot {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4ade80;
      border: 2px solid #0f172a;
    }
    .hero-identity { padding-bottom: 0; }
    .hero-name {
      color: #f8fafc;
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 3px;
    }
    .hero-role {
      color: #94a3b8;
      font-size: 13px;
      margin: 0 0 10px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,.07);
      color: #cbd5e1;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      border: 0.5px solid rgba(255,255,255,.12);
    }
    .hero-actions {
      display: flex;
      gap: 8px;
      padding-top: 4px;
    }
    .btn-hire-hero {
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-hire-hero:hover { background: #2563eb; }
    .btn-msg-hero {
      background: transparent;
      color: #94a3b8;
      border: 0.5px solid rgba(255,255,255,.15);
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-msg-hero:hover { background: rgba(255,255,255,.06); }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 0.5px solid #e2e8f0;
    }
    .h-stat {
      padding: 16px 20px;
      border-right: 0.5px solid #e2e8f0;
    }
    .h-stat:last-child { border-right: none; }
    .h-stat-label {
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: .05em;
      text-transform: uppercase;
      margin: 0 0 5px;
    }
    .h-stat-val {
      font-size: 18px;
      font-weight: 500;
      color: #0f172a;
      margin: 0;
    }
    .h-stat-val.accent { color: #185FA5; }

    /* ── Two-column layout ── */
    .two-col {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 252px;
      gap: 16px;
    }
    .left-col { display: flex; flex-direction: column; gap: 16px; }
    .right-col { display: flex; flex-direction: column; gap: 14px; }

    /* ── Cards ── */
    .card {
      background: #fff;
      border: 0.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px 24px;
    }
    .card-label {
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin: 0 0 14px;
    }
    .bio-text {
      font-size: 14px;
      color: #475569;
      line-height: 1.75;
      margin: 0;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 14px;
    }
    .tag {
      font-size: 12px;
      color: #475569;
      background: #f8fafc;
      border: 0.5px solid #e2e8f0;
      border-radius: 20px;
      padding: 4px 11px;
    }

    /* ── Work history ── */
    .job {
      padding: 18px 0;
      border-bottom: 0.5px solid #f1f5f9;
    }
    .job.first { padding-top: 0; }
    .job:last-of-type { border-bottom: none; padding-bottom: 0; }
    .job-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .job-title {
      font-size: 14px;
      font-weight: 500;
      color: #0f172a;
    }
    .job-co {
      font-size: 13px;
      color: #94a3b8;
    }
    .job-period {
      font-size: 12px;
      color: #94a3b8;
      margin: 0 0 10px;
    }
    .job-quote {
      font-size: 13px;
      color: #475569;
      line-height: 1.7;
      border-left: 2px solid #e2e8f0;
      border-radius: 0;
      padding-left: 12px;
      margin: 0;
    }
    .more-btn {
      width: 100%;
      margin-top: 16px;
      padding: 10px;
      background: transparent;
      border: 0.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 12px;
      color: #64748b;
      cursor: pointer;
    }
    .more-btn:hover { background: #f8fafc; }

    /* ── Sidebar cards ── */
    .sidebar-card {
      background: #fff;
      border: 0.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    .s-label {
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin: 0 0 16px;
    }
    .rate-display {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 10px;
    }
    .rate-num {
      font-size: 28px;
      font-weight: 500;
      color: #0f172a;
    }
    .rate-unit {
      font-size: 13px;
      color: #94a3b8;
    }
    .star-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
    }
    .stars { color: #EF9F27; font-size: 14px; letter-spacing: 1px; }
    .star-meta { font-size: 12px; color: #94a3b8; }

    .btn-hire-full {
      display: block;
      width: 100%;
      padding: 11px;
      background: #0f172a;
      color: #f8fafc;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 8px;
      text-align: center;
    }
    .btn-hire-full:hover { background: #1e293b; }
    .btn-disabled {
      background: #94a3b8 !important;
      cursor: not-allowed !important;
      opacity: 0.7;
    }
    .btn-msg-full {
      display: block;
      width: 100%;
      padding: 10px;
      background: transparent;
      color: #475569;
      border: 0.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
    }
    .btn-msg-full:hover { background: #f8fafc; }

    .save-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 12px;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
    }
    .save-row:hover { color: #475569; }

    /* ── Performance metrics ── */
    .metric { margin-bottom: 14px; }
    .metric:last-child { margin-bottom: 0; }
    .metric-top {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .metric-name { color: #475569; }
    .metric-pct { font-weight: 500; color: #0f172a; }
    .track {
      height: 3px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 2px;
      background: #185FA5;
    }

    /* ── Certifications ── */
    .cert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 0.5px solid #f1f5f9;
    }
    .cert-item:first-of-type { padding-top: 0; }
    .cert-item:last-child { border-bottom: none; padding-bottom: 0; }
    .cert-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #185FA5;
      flex-shrink: 0;
    }
    .cert-name {
      font-size: 13px;
      font-weight: 500;
      color: #0f172a;
      margin: 0;
    }
    .cert-sub {
      font-size: 11px;
      color: #94a3b8;
      margin: 2px 0 0;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .two-col { grid-template-columns: 1fr; }
      .hero-top { flex-direction: column; gap: 16px; padding-bottom: 20px; }
      .hero-stats { grid-template-columns: repeat(2, 1fr); }
      .h-stat:nth-child(2) { border-right: none; }
    }
  `]
})
export class ClientWorkerProfilePage {
  route = inject(ActivatedRoute);
  router = inject(Router);
  state = inject(PlatformStateService);

  worker = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    const w = this.state.workers().find(w => w.id === id);
    // Critical Rule: Clients interact ONLY with verified workers.
    return (w && w.status === 'Verified') ? w : null;
  });

  displayCerts = computed(() => this.worker()?.certifications || []);
  displayHistory = computed(() => this.worker()?.workHistory || []);

  metrics = computed(() => {
    const w = this.worker();
    const rating = Math.round((w?.rating || 0) * 20);
    const reviewCoverage = Math.min(100, (w?.reviews || 0) * 10);
    return [
      { label: 'Job Success', value: this.successRate() },
      { label: 'Client Recommendation', value: rating },
      { label: 'Review Coverage', value: reviewCoverage }
    ];
  });

  successRate = computed(() => {
    const reviews = this.worker()?.reviews || 0;
    return reviews > 0 ? Math.min(100, 80 + reviews) : 0;
  });
  
  hasPendingRequest = computed(() => {
    const w = this.worker();
    if (!w) return false;
    return this.state.bookings().some(b => 
      b.workerId === w.id && (b.status === 'PENDING' || b.status === 'ACCEPTED')
    );
  });

  hire() {
    const w = this.worker();
    if (w) {
      this.state.hireWorker(w.id);
      this.router.navigate(['/client/bookings']);
    }
  }

  message() {
    const w = this.worker();
    if (w) {
      this.state.startChat(w.id);
      this.router.navigate(['/client/messages']);
    }
  }
}