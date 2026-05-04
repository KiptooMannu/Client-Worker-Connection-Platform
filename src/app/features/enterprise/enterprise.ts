import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-enterprise',
  standalone: true,
  imports: [CommonModule, MatIconModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-[#f6faff] flex flex-col font-['Inter']">
      <app-navbar></app-navbar>

      <!-- Hero Section -->
      <header class="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-[#1a2b3c]">
        <div class="absolute inset-0 opacity-20">
          <img class="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay" 
               src="https://lh3.googleusercontent.com/aida/ADBb0ujIy7uTj_qxMJs9PPu46hQ0uwMJeOrMZFeLIbDSNWRYuBe7kfw8Rxy1eyn_2my_xMuX_C0EpW-hq0AEmwL2Z9wMam8c-4gXk0ktrBJvnbsawkkxRxEFu8-24Z33wDN448u5leloAf6mU21oeNRET8QBPTdJIxEwqgR35U8UZo3HS0J4Symx03kn1TqippigXKfk2PWIywfPqYOhF2ODL6jUl0xF0EZc045diXXe-4jAi8NZu9ncxRZufbDPvXVfsLeHdRApi_khs_I"
               alt="Enterprise Background">
        </div>
        <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span class="inline-block py-1 px-3 mb-6 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
              Enterprise Ready
            </span>
            <h1 class="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight font-['Manrope']">
              Enterprise Talent Infrastructure for Global Scale.
            </h1>
            <p class="text-lg text-slate-300 mb-10 max-w-xl font-medium">
              Unify your contingent workforce with Kazi Konnect’s verified talent network, custom compliance workflows, and dedicated account management.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="bg-[#0059bb] text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg hover:bg-[#0070ea] transition-all active:scale-95 flex items-center justify-center gap-2">
                Request a Demo
                <mat-icon class="!text-sm">arrow_forward</mat-icon>
              </button>
              <button class="bg-transparent border border-white/30 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white/10 transition-all active:scale-95">
                Download Whitepaper
              </button>
            </div>
          </div>
          
          <div class="hidden lg:block">
            <div class="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 p-1 bg-white/5 backdrop-blur-sm">
              <div class="bg-[#041627]/80 p-10 rounded-[1.8rem]">
                <div class="flex items-center gap-6 mb-10">
                  <div class="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <mat-icon class="!text-white !text-2xl">verified</mat-icon>
                  </div>
                  <div>
                    <div class="text-white text-2xl font-black font-['Manrope']">99.9% Compliance</div>
                    <div class="text-slate-400 text-sm font-bold uppercase tracking-widest">Verified Network Security</div>
                  </div>
                </div>
                <div class="space-y-6">
                  <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 w-[92%] transition-all duration-1000"></div>
                  </div>
                  <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Risk Mitigation</span>
                    <span class="text-emerald-400">92% Optimized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Trust/Partners Section -->
      <section class="py-20 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 class="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-16">Trusted by Global Standards Organizations</h2>
          <div class="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
             <span class="text-2xl font-black text-[#1a2b3c] tracking-tighter uppercase">EnterpriseV</span>
             <span class="text-2xl font-black text-[#1a2b3c] tracking-tighter uppercase">SecureCore</span>
             <span class="text-2xl font-black text-[#1a2b3c] tracking-tighter uppercase">GlobalVerify</span>
             <span class="text-2xl font-black text-[#1a2b3c] tracking-tighter uppercase">StandardsInc</span>
          </div>
        </div>
      </section>

      <!-- Key Solutions Section -->
      <section class="py-32 bg-[#f6faff]">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="mb-20">
            <h2 class="text-4xl font-black text-[#041627] mb-4 font-['Manrope'] tracking-tight">Enterprise-Grade Solutions</h2>
            <div class="w-20 h-1.5 bg-emerald-500 rounded-full"></div>
          </div>
          
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div *ngFor="let solution of solutions" 
                 class="bg-white p-8 rounded-[2rem] shadow-[0_4px_24px_rgba(4,22,39,0.04)] hover:shadow-[0_12px_48px_rgba(4,22,39,0.08)] transition-all border border-slate-50 group cursor-pointer">
              <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#041627] transition-colors">
                <mat-icon class="text-[#0059bb] group-hover:text-white transition-colors">{{ solution.icon }}</mat-icon>
              </div>
              <h3 class="text-xl font-black text-[#041627] mb-4 font-['Manrope']">{{ solution.title }}</h3>
              <p class="text-slate-500 text-sm font-medium leading-relaxed">{{ solution.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Process Section -->
      <section class="py-32 bg-[#041627] text-white overflow-hidden relative">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <h2 class="text-4xl md:text-5xl font-black text-center mb-24 font-['Manrope']">How Kazi Konnect Enterprise Works</h2>
          <div class="grid md:grid-cols-4 gap-12 relative">
            <div *ngFor="let step of steps; let i = index" class="text-center group">
              <div class="w-20 h-20 bg-[#0059bb] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-[#041627] group-hover:scale-110 transition-transform relative z-10">
                <span class="text-2xl font-black italic">0{{ i + 1 }}</span>
              </div>
              <h4 class="text-xl font-black mb-3 font-['Manrope']">{{ step.title }}</h4>
              <p class="text-slate-400 text-sm font-medium leading-relaxed px-4">{{ step.desc }}</p>
            </div>
            
            <!-- Connector Line -->
            <div class="hidden md:block absolute top-10 left-0 w-full h-px bg-white/5 -z-0"></div>
          </div>
        </div>
      </section>

      <!-- Case Study Section -->
      <section class="py-32 bg-[#f0f4f8]">
        <div class="max-w-4xl mx-auto px-6 text-center">
          <div class="mb-12">
            <mat-icon class="!text-6xl !w-auto !h-auto text-emerald-500/30">format_quote</mat-icon>
          </div>
          <blockquote class="text-2xl md:text-3xl font-black text-[#041627] italic mb-12 leading-tight font-['Manrope']">
            "Kazi Konnect has revolutionized how we handle our external specialist teams. The verification speed and compliance depth allow us to scale across borders while maintaining rigorous legal standards."
          </blockquote>
          <div class="flex items-center justify-center gap-6">
            <div class="w-16 h-16 bg-slate-300 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcWUsz_Bq_tpI8wFtRwzofKBDY4RLGYTyfH5TbsFYHCEYycBctdcrdRHVEETEsE5tEv7jz6m_lRKO30JN_PofyjEk75MuU4hVIbgJICnFinjZkdweuXfjpydImmja2Rs1WZduJuVBjAuJFW3Kd9pkF5UhfWNu2DtdTxLexNF6jFmc1jxDDG9Q82MhLMHW3KrA45jwip7R7saVKLzbRCXpA--Kp7sprb0qb4phd5XftzC6XnTTHNcVa58GaWsNnCRu-BeLmc62FBykx" 
                   alt="Executive" class="w-full h-full object-cover">
            </div>
            <div class="text-left">
              <div class="text-xl font-black text-[#041627] font-['Manrope']">Marcus Sterling</div>
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chief Operating Officer, Global Logistix</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-32 bg-white text-center">
        <div class="max-w-4xl mx-auto px-6">
          <h2 class="text-4xl md:text-5xl font-black text-[#041627] mb-8 font-['Manrope']">Ready to scale with confidence?</h2>
          <p class="text-lg text-slate-500 mb-12 font-medium">Join over 200 enterprises using Kazi Konnect to secure and manage their elite talent networks.</p>
          <button class="bg-[#041627] text-white font-black text-xs uppercase tracking-widest px-12 py-5 rounded-2xl shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
            Speak with an Enterprise Advisor
          </button>
          
          <div class="mt-12 flex flex-wrap justify-center items-center gap-8 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
            <div class="flex items-center gap-2">
              <mat-icon class="!text-sm">check_circle</mat-icon>
              <span>No-obligation Consultation</span>
            </div>
            <div class="flex items-center gap-2">
              <mat-icon class="!text-sm">check_circle</mat-icon>
              <span>Custom Pilot Programs</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-auto py-12 flex justify-center items-center bg-[#041627]">
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          &copy; 2024 Kazi Konnect. All rights reserved.
        </p>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EnterprisePage {
  auth = inject(AuthService);

  solutions = [
    { icon: 'fact_check', title: 'Bulk Verification', desc: 'Scale your vetting processes with multi-layer background checks for entire departments and global teams.' },
    { icon: 'security', title: 'Compliance Engine', desc: "Custom verification gates that align with your industry's specific legal and regulatory requirements automatically." },
    { icon: 'api', title: 'API Integration', desc: 'Seamlessly connect talent data with your existing HRIS, ERP, and internal management systems.' },
    { icon: 'account_balance', title: 'Global Escrow', desc: 'Managed payments across borders with enterprise-grade security and automated financial reporting.' }
  ];

  steps = [
    { title: 'Consultation', desc: 'Initial assessment of workforce needs and compliance requirements.' },
    { title: 'Workflow Design', desc: 'Building custom verification gates and integration mappings.' },
    { title: 'Talent Migration', desc: 'Seamless onboarding of existing or new talent to the network.' },
    { title: 'Scaled Operations', desc: 'Fully managed workforce scaling with 24/7 dedicated support.' }
  ];
}
