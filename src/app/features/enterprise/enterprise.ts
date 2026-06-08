import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-enterprise',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-surface font-manrope">
      <app-navbar [showMessages]="false"></app-navbar>

      <main class="animate-in fade-in duration-1000">
        <!-- Hero Section -->
        <section class="relative py-24 md:py-32 overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
            <span class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-teal-soft text-brand-teal rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-brand-teal/10 shadow-sm">
              <mat-icon class="!text-[14px]">corporate_fare</mat-icon>
              Enterprise Grade Talent
            </span>
            <h1 class="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight mb-8">Scale Your Workforce <br class="hidden md:block"> <span class="text-brand-teal">Without Friction</span></h1>
            <p class="max-w-3xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">Empowering organizations with verified professional labor, automated compliance, and real-time operational oversight.</p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button class="w-full sm:w-auto bg-brand-teal text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-teal hover:bg-brand-teal-dark active:scale-95 transition-all">Request a Demo</button>
              <button class="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">View Case Studies</button>
            </div>
          </div>
          
          <!-- Background Decoration -->
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
            <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-teal-soft rounded-full blur-[120px] animate-pulse"></div>
            <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal-10 rounded-full blur-[120px] animate-pulse"></div>
          </div>
        </section>

        <!-- Solutions Grid -->
        <section class="py-24 bg-white border-y border-slate-100">
          <div class="max-w-7xl mx-auto px-6 lg:px-12">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div class="space-y-6 group">
                <div class="w-16 h-16 bg-brand-teal-soft rounded-2xl flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all duration-500 shadow-sm">
                  <mat-icon class="!text-3xl">verified</mat-icon>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Verified Compliance</h3>
                <p class="text-slate-500 font-medium leading-relaxed">Automated document verification and background checks for every professional on your payroll.</p>
              </div>
              <div class="space-y-6 group">
                <div class="w-16 h-16 bg-brand-teal-soft rounded-2xl flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all duration-500 shadow-sm">
                  <mat-icon class="!text-3xl">api</mat-icon>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">API Integration</h3>
                <p class="text-slate-500 font-medium leading-relaxed">Connect your existing ERP or HR systems directly to our marketplace for seamless staffing.</p>
              </div>
              <div class="space-y-6 group">
                <div class="w-16 h-16 bg-brand-teal-soft rounded-2xl flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all duration-500 shadow-sm">
                  <mat-icon class="!text-3xl">account_balance_wallet</mat-icon>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Secure Settlement</h3>
                <p class="text-slate-500 font-medium leading-relaxed">Secure M-Pesa payment flows with automated milestone-based approval and settlement.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="py-24 bg-brand-teal-dark text-white">
          <div class="max-w-5xl mx-auto px-6 text-center">
            <h2 class="text-4xl md:text-5xl font-black tracking-tight mb-8">Ready to transform your enterprise operations?</h2>
            <p class="text-white/80 text-lg font-medium mb-12">Join over 200+ organizations leveraging Kazi Konnect for their professional labor needs.</p>
            <button class="bg-brand-teal text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-teal/40 hover:bg-brand-teal-dark active:scale-95 transition-all">Talk to an Expert</button>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class EnterprisePage {}
