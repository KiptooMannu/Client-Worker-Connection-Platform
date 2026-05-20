import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-solutions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-surface font-manrope">
      <app-navbar [showMessages]="false"></app-navbar>

      <main class="animate-in fade-in duration-1000">
        <!-- Hero Section -->
        <section class="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div class="space-y-8 relative z-10">
              <span class="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">
                <mat-icon class="!text-[14px]">psychology</mat-icon>
                Custom Tailored Solutions
              </span>
              <h1 class="text-6xl font-black text-slate-900 tracking-tighter leading-tight">Staffing Solutions <br> For <span class="text-emerald-600 underline decoration-4 underline-offset-8">Every Industry</span></h1>
              <p class="text-xl text-slate-500 font-medium leading-relaxed">From agriculture to technology, we provide specialized marketplaces that connect the right expertise with the right tasks, instantly.</p>
              <div class="flex flex-wrap gap-4 pt-4">
                <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <mat-icon class="text-emerald-500">done_all</mat-icon>
                  <span class="text-[11px] font-black uppercase tracking-widest text-slate-700">Rapid Deployment</span>
                </div>
                <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <mat-icon class="text-emerald-500">done_all</mat-icon>
                  <span class="text-[11px] font-black uppercase tracking-widest text-slate-700">Cost Efficient</span>
                </div>
              </div>
            </div>
            
            <div class="relative group">
              <div class="w-full aspect-square bg-white rounded-[3rem] shadow-2xl border border-white relative overflow-hidden group-hover:rotate-1 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10"></div>
                <div class="p-12 space-y-8 relative z-10">
                  <div class="w-full h-12 bg-slate-50 rounded-xl animate-pulse"></div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="h-32 bg-slate-50 rounded-3xl animate-pulse"></div>
                    <div class="h-32 bg-slate-50 rounded-3xl animate-pulse delay-75"></div>
                  </div>
                  <div class="h-48 bg-slate-100/50 rounded-[2.5rem] animate-pulse delay-150"></div>
                </div>
              </div>
              <!-- Floating Badge -->
              <div class="absolute -top-8 -right-8 w-32 h-32 bg-indigo-600 rounded-full flex flex-col items-center justify-center text-white text-center p-4 shadow-2xl animate-bounce-slow">
                <span class="text-2xl font-black">99%</span>
                <span class="text-[8px] font-black uppercase tracking-widest leading-tight">Service Satisfaction</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Industry Categories -->
        <section class="py-24">
          <div class="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center mb-16">Explore Specializations</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              @for (item of solutions; track item.title) {
                <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
                  <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mb-6 shadow-inner">
                    <mat-icon>{{ item.icon }}</mat-icon>
                  </div>
                  <h4 class="text-lg font-black text-slate-900 mb-4">{{ item.title }}</h4>
                  <p class="text-slate-500 text-sm leading-relaxed">{{ item.desc }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Process Section -->
        <section class="py-24 bg-slate-900 text-white overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div class="space-y-4">
              <div class="text-5xl font-black text-emerald-500 mb-6 opacity-40 italic">01.</div>
              <h3 class="text-2xl font-black tracking-tight">Define Requirements</h3>
              <p class="text-slate-400 font-medium">Create a detailed project profile and specify required skill-sets for your task.</p>
            </div>
            <div class="space-y-4">
              <div class="text-5xl font-black text-emerald-500 mb-6 opacity-40 italic">02.</div>
              <h3 class="text-2xl font-black tracking-tight">Expert Alignment</h3>
              <p class="text-slate-400 font-medium">Our algorithm matches you with the top 3% of available local professionals.</p>
            </div>
            <div class="space-y-4">
              <div class="text-5xl font-black text-emerald-500 mb-6 opacity-40 italic">03.</div>
              <h3 class="text-2xl font-black tracking-tight">Secure Delivery</h3>
              <p class="text-slate-400 font-medium">Work is completed, verified, and funds are released through secure escrow.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-bounce-slow {
      animation: bounce 4s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }
  `]
})
export class SolutionsPage {
  solutions = [
    { icon: 'agriculture', title: 'Agriculture', desc: 'Expert farm labor, harvesting specialists, and irrigation engineers.' },
    { icon: 'construction', title: 'Construction', desc: 'Certified builders, structural masons, and professional architects.' },
    { icon: 'cleaning_services', title: 'Maintenance', desc: 'Industrial cleaners, HVAC technicians, and facility managers.' },
    { icon: 'settings', title: 'Technical', desc: 'Software developers, IT support, and system administrators.' }
  ];
}
