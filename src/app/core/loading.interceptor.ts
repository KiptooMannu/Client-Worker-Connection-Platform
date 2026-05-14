import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, timeout, catchError } from 'rxjs';
import { LoadingService } from './services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Skip loading for background polling requests
  const isBackgroundRequest = req.url.includes('/notifications/') || 
                              req.url.includes('/messages/user/') ||
                              req.url.includes('/messages/typing');

  // Manual show() call disabled to prevent automatic overlays on every request
  // if (!isBackgroundRequest) {
  //   loadingService.show();
  // }
  
  return next(req).pipe(
    // Increased safety timeout to prevent stuck loading screens on hanging requests
    timeout(60000), 
    finalize(() => {
      if (!isBackgroundRequest) {
        loadingService.hide();
      }
    }),
    catchError((err) => {
      // Ensure hide is called even on error if finalize doesn't catch it for some reason
      if (!isBackgroundRequest) {
        loadingService.hide();
      }
      throw err;
    })
  );
};

