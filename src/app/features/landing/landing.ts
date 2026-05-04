import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { PlatformStateService } from '../../core/services/platform-state.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './landing.html'
})
export class LandingPage {
  auth = inject(AuthService);
  state = inject(PlatformStateService);
  
  selectedOverview = signal<'trust' | 'scale' | 'settlement'>('trust');

  overviews = {
    trust: {
      title: 'Trust & Safety',
      highlight: 'Kazi Konnect facilitates secure connections by enforcing multi-layer identity protocols—ensuring absolute peace of mind.',
      description: 'Our platform is designed from the ground up to prioritize human-centric security. Every participant undergoes a rigorous vetting process that includes credential auditing, background checks, and identity confirmation through the L4 protocol.',
      footer: 'Platform Trust Index: 99.8% Verified'
    },
    scale: {
      title: 'Marketplace Scale',
      highlight: 'Empowering local expertise with global standards—creating a borderless marketplace for elite professional services.',
      description: 'We bridge the gap between high-stakes project requirements and verified local specialists. Our infrastructure supports rapid scaling for enterprise partners while maintaining the precision of a boutique consultancy.',
      footer: 'Institutional Partners: 200+'
    },
    settlement: {
      title: 'Secure Settlement',
      highlight: 'Institutional-grade escrow systems ensure equitable value exchange—releasing funds only upon verified milestone success.',
      description: 'The Kazi Konnect settlement layer is built on transparent governance. We eliminate financial risk for both parties by holding funds in secure accounts and automating release cycles based on multi-signature project approval.',
      footer: 'Total Managed Volume: $4.2M+'
    }
  };
}
