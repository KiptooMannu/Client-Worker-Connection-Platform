import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { LandingService, LandingStats, Testimonial } from '../../core/services/landing.service';
import { NavbarComponent } from '../../shared/components/navbar';

/** One statistic tile. `value` is resolved from live API data. */
interface StatTile {
  value: string;
  label: string;
  icon: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  body: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface TrustBadge {
  icon: string;
  label: string;
  detail: string;
}

type OverviewKey = 'trust' | 'scale' | 'settlement';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, NavbarComponent],
  templateUrl: './landing.html'
})
export class LandingPage implements OnInit, AfterViewInit, OnDestroy {
  auth = inject(AuthService);
  state = inject(PlatformStateService);
  router = inject(Router);

  private landing = inject(LandingService);
  private title = inject(Title);
  private meta = inject(Meta);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  private revealObserver?: IntersectionObserver;

  /** Null until loaded; sections bind to `statTiles()` which handles the empty case. */
  stats = signal<LandingStats | null>(null);
  statsLoading = signal(true);

  testimonials = signal<Testimonial[]>([]);
  testimonialsLoading = signal(true);

  /** Index of the open FAQ row, or null when all are collapsed. */
  openFaq = signal<number | null>(0);

  selectedOverview = signal<OverviewKey>('trust');

  ngOnInit(): void {
    // Signed-in visitors go straight to their workspace.
    if (this.auth.isAuthenticated()) {
      const role = this.auth.userRole();
      if (role === 'Worker') { this.router.navigate(['/worker']); return; }
      if (role === 'Client') { this.router.navigate(['/client']); return; }
      if (role === 'Admin') { this.router.navigate(['/admin']); return; }
    }

    this.applySeoTags();
    this.loadContent();
  }

  ngAfterViewInit(): void {
    this.setupScrollReveal();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.removeStructuredData();
  }

  // ── Content loading ─────────────────────────────────────────────────────

  private loadContent(): void {
    this.landing.getStats().subscribe(stats => {
      this.stats.set(stats);
      this.statsLoading.set(false);
    });

    this.landing.getTestimonials().subscribe(items => {
      this.testimonials.set(items ?? []);
      this.testimonialsLoading.set(false);
    });
  }

  // ── SEO ─────────────────────────────────────────────────────────────────

  private applySeoTags(): void {
    const pageTitle = 'Kazi Konnect — Hire Verified Local Professionals in Kenya';
    const description =
      'Kazi Konnect connects you with vetted local professionals. ' +
      'Funds are held in escrow and released only when work is approved, with M-Pesa settlement.';
    const url = environmentSafeUrl(this.document);

    this.title.setTitle(pageTitle);

    const tags: Record<string, string> = {
      'description': description,
      'robots': 'index, follow',
      'og:type': 'website',
      'og:title': pageTitle,
      'og:description': description,
      'og:site_name': 'Kazi Konnect',
      'twitter:card': 'summary_large_image',
      'twitter:title': pageTitle,
      'twitter:description': description
    };

    Object.entries(tags).forEach(([name, content]) => {
      const selector = name.startsWith('og:') ? `property='${name}'` : `name='${name}'`;
      this.meta.updateTag(
        name.startsWith('og:') ? { property: name, content } : { name, content },
        selector
      );
    });

    if (url) {
      this.meta.updateTag({ property: 'og:url', content: url }, `property='og:url'`);
      this.setCanonical(url);
    }

    this.injectStructuredData();
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    if (!head) return;
    let link = head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * FAQPage JSON-LD, generated from the same `faqs` array the template renders
   * so the markup and the structured data cannot drift apart.
   *
   * Organization schema is declared statically in index.html instead — it is
   * site-wide, and a static tag is visible to crawlers that don't run JS. This
   * one is page-specific, so it is added and removed with the page.
   */
  private injectStructuredData(): void {
    const head = this.document.head;
    if (!head) return;

    this.removeStructuredData();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    };

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-landing-schema', 'true');
    script.textContent = JSON.stringify(schema);
    head.appendChild(script);
  }

  /** Keeps the FAQ schema from leaking onto other routes after navigation. */
  private removeStructuredData(): void {
    this.document.head
      ?.querySelectorAll("script[data-landing-schema='true']")
      .forEach(node => node.remove());
  }

  // ── Scroll reveal ───────────────────────────────────────────────────────

  /**
   * Adds `is-visible` to `[data-reveal]` elements as they enter the viewport.
   *
   * Elements start at full opacity in CSS and are only dimmed once this runs,
   * so with JS disabled or during SSR the page is fully readable — the reveal
   * is additive, never a prerequisite for seeing content. Honours
   * prefers-reduced-motion by skipping the effect entirely.
   */
  private setupScrollReveal(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]')
    );
    if (!targets.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    // Opt in to the animation only now that we know it will be driven.
    targets.forEach(el => el.classList.add('reveal-armed'));

    this.revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    targets.forEach(el => this.revealObserver!.observe(el));
  }

  // ── Interaction ─────────────────────────────────────────────────────────

  toggleFaq(index: number): void {
    this.openFaq.set(this.openFaq() === index ? null : index);
  }

  selectOverview(key: OverviewKey): void {
    this.selectedOverview.set(key);
  }

  /** Keeps in-page anchors from triggering a router navigation or a hard jump. */
  handleAnchor(event: Event, id: string): void {
    event.preventDefault();
    this.scrollTo(id);
  }

  /** Anchor scrolling that respects reduced-motion and works under SSR. */
  scrollTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = this.document.getElementById(id);
    if (!target) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  // ── Derived view data ───────────────────────────────────────────────────

  /**
   * Statistics tiles built from live counts. Any figure the API doesn't yet
   * support is omitted rather than shown as zero, so an early-stage platform
   * never advertises "0 jobs completed".
   */
  statTiles(): StatTile[] {
    const s = this.stats();
    if (!s) return [];

    const tiles: StatTile[] = [];

    if (s.verifiedWorkers > 0) {
      tiles.push({
        value: this.compactNumber(s.verifiedWorkers),
        label: 'Verified professionals',
        icon: 'verified_user'
      });
    }
    if (s.jobsCompleted > 0) {
      tiles.push({
        value: this.compactNumber(s.jobsCompleted),
        label: 'Jobs completed',
        icon: 'task_alt'
      });
    }
    if (s.registeredClients > 0) {
      tiles.push({
        value: this.compactNumber(s.registeredClients),
        label: 'Clients onboarded',
        icon: 'groups'
      });
    }
    if (s.volumeProcessed > 0) {
      tiles.push({
        value: this.compactCurrency(s.volumeProcessed),
        label: 'Settled through escrow',
        icon: 'account_balance'
      });
    }
    if (s.totalReviews > 0 && s.averageRating > 0) {
      tiles.push({
        value: `${s.averageRating.toFixed(1)}/5`,
        label: `From ${this.compactNumber(s.totalReviews)} reviews`,
        icon: 'star'
      });
    }

    return tiles;
  }

  hasStats(): boolean {
    return this.statTiles().length > 0;
  }

  hasTestimonials(): boolean {
    return this.testimonials().length > 0;
  }

  /** Filled-star count for a rating row; the numeric value is also rendered as text. */
  starsFor(rating: number): number[] {
    const safe = Math.max(0, Math.min(5, Math.round(rating || 0)));
    return Array.from({ length: safe }, (_, i) => i);
  }

  private compactNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
    return `${value}`;
  }

  private compactCurrency(value: number): string {
    if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
    return `KES ${Math.round(value).toLocaleString()}`;
  }

  // ── Static content ──────────────────────────────────────────────────────

  readonly skeletonStats = [0, 1, 2, 3];
  readonly skeletonTestimonials = [0, 1, 2];

  /** Drives both the tablist and the panels, so they can't fall out of sync. */
  readonly overviewKeys: OverviewKey[] = ['trust', 'scale', 'settlement'];

  readonly currentYear = new Date().getFullYear();

  readonly trustBadges: TrustBadge[] = [
    {
      icon: 'verified_user',
      label: 'Identity verified',
      detail: 'Every professional passes document and identity checks before going live.'
    },
    {
      icon: 'lock',
      label: 'Escrow protected',
      detail: 'Your payment is held securely and released only when you approve the work.'
    },
    {
      icon: 'phone_iphone',
      label: 'M-Pesa settlement',
      detail: 'Pay and get paid through Kenya\'s most trusted mobile money rails.'
    },
    {
      icon: 'gavel',
      label: 'Dispute resolution',
      detail: 'If something goes wrong, our team reviews the evidence and rules fairly.'
    }
  ];

  readonly features: FeatureCard[] = [
    {
      icon: 'fact_check',
      title: 'Strict vetting',
      body: 'Credentials, documents and identity are audited before a professional can accept work.'
    },
    {
      icon: 'location_on',
      title: 'Hyper-local',
      body: 'Find skilled people near you, filtered by trade, location and availability.'
    },
    {
      icon: 'shield',
      title: 'Secure settlement',
      body: 'Funds sit in escrow until the job is approved, protecting both sides of every deal.'
    },
    {
      icon: 'balance',
      title: 'Fair governance',
      body: 'Transparent pricing, clear dispute rules and an audit trail on every transaction.'
    }
  ];

  readonly faqs: FaqItem[] = [
    {
      question: 'How do I get started?',
      answer:
        'Create an account and choose whether you are hiring or joining as a professional. ' +
        'Clients can post a request immediately; professionals complete verification first.'
    },
    {
      question: 'How are payments kept secure?',
      answer:
        'When you fund a job the money goes into escrow rather than straight to the worker. ' +
        'It is released only after you approve the completed work, and you can pay from your ' +
        'wallet balance, via M-Pesa, or a combination of both.'
    },
    {
      question: 'What happens if the work is not right?',
      answer:
        'You can request a revision before approving. If you and the professional cannot agree, ' +
        'open a dispute and our team reviews the evidence from both sides before deciding how ' +
        'the escrowed funds are settled.'
    },
    {
      question: 'How are professionals verified?',
      answer:
        'Each applicant submits identity documents and supporting credentials, which our ' +
        'verification team reviews manually. Only approved profiles appear in the marketplace.'
    },
    {
      question: 'What does it cost?',
      answer:
        'Creating an account and browsing is free. A platform fee is deducted from each ' +
        'completed job, and the exact amount is shown before you confirm any payment.'
    },
    {
      question: 'Can enterprises hire at scale?',
      answer:
        'Yes. Enterprise accounts support multi-role team builds, approval workflows and ' +
        'consolidated reporting across every engagement.'
    }
  ];

  readonly overviews: Record<OverviewKey, {
    title: string;
    highlight: string;
    description: string;
    footer: string;
  }> = {
    trust: {
      title: 'Trust & Safety',
      highlight:
        'Multi-layer identity checks on every professional, so you always know who you are hiring.',
      description:
        'Every participant is vetted before they can take work: documents are reviewed, ' +
        'credentials are checked, and identity is confirmed by our verification team.',
      footer: 'Manual review on every application'
    },
    scale: {
      title: 'Marketplace Scale',
      highlight:
        'Local expertise held to consistent standards, whether you hire one person or fifty.',
      description:
        'We connect demanding project requirements with verified local specialists, and the ' +
        'platform supports rapid team builds without losing oversight of any single job.',
      footer: 'Built for repeat and enterprise hiring'
    },
    settlement: {
      title: 'Secure Settlement',
      highlight:
        'Money moves only when work is approved — no upfront risk for either side.',
      description:
        'Payments are held in escrow and released against approved milestones. Both parties ' +
        'see the same transaction record, and every movement is logged.',
      footer: 'Escrow-backed, fully auditable'
    }
  };
}

/** Reads the current absolute URL when one exists (absent during SSR prerender). */
function environmentSafeUrl(doc: Document): string | null {
  try {
    const href = doc?.location?.href;
    if (!href || href.startsWith('about:')) return null;
    return href.split('#')[0].split('?')[0];
  } catch {
    return null;
  }
}
