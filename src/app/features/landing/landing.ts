import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { PlatformStateService } from '../../core/services/platform-state.service';

import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, NavbarComponent],
  templateUrl: './landing.html'
})
export class LandingPage implements OnInit {
  auth = inject(AuthService);
  state = inject(PlatformStateService);
  router = inject(Router);
  
  selectedOverview = signal<'trust' | 'scale' | 'settlement'>('trust');

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      const role = this.auth.userRole();
      if (role === 'Worker') this.router.navigate(['/worker']);
      else if (role === 'Client') this.router.navigate(['/client']);
      else if (role === 'Admin') this.router.navigate(['/admin']);
    }
  }

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
