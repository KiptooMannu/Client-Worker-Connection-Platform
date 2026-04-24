import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavbarComponent
  ],
  template: `
    <div class="min-h-screen bg-[#f7f9fb] flex flex-col">
      <app-navbar></app-navbar>

      <!-- Main Content Area -->
      <main class="flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 py-12">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-slate-100 mt-auto">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center py-12 px-12">
          <div class="flex items-center gap-4 opacity-50">
            <span class="text-lg font-black tracking-tighter text-[#041627]">ProMarket</span>
            <p class="text-xs font-medium text-slate-500">© 2024 Infrastructure. All rights reserved.</p>
          </div>
          <div class="flex gap-8 mt-6 md:mt-0">
            <a class="text-xs font-black text-slate-400 hover:text-[#041627] transition-colors uppercase tracking-widest cursor-pointer" href="#">Legal</a>
            <a class="text-xs font-black text-slate-400 hover:text-[#041627] transition-colors uppercase tracking-widest cursor-pointer" href="#">Privacy</a>
            <a class="text-xs font-black text-slate-400 hover:text-[#041627] transition-colors uppercase tracking-widest cursor-pointer" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ClientLayout {}
