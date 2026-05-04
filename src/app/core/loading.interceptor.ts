import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // The global loading spinner has been disabled to prevent full-screen overlays.
  // Individual components should handle their own loading states (e.g. button loaders).
  
  return next(req);
};
