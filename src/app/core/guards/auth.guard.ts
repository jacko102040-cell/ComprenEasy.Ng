import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AcademicFlowSummary } from '../models/academic-flow.models';
import { AuthService } from '../services/auth.service';
import { AcademicFlowService } from '../services/academic-flow.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const academicFlowService = inject(AcademicFlowService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[] | undefined;
  const allowedAcademicStages = route.data['allowedAcademicStages'] as string[] | undefined;
  const requiredAcademicAccessFlag = route.data['requiredAcademicAccessFlag'] as
    | keyof AcademicFlowSummary
    | undefined;

  return authService.loadCurrentUser().pipe(
    switchMap((user) => {
      if (!user) {
        return of(router.createUrlTree(['/login']));
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return of(router.createUrlTree([user.role === 'Teacher' ? '/teacher/students' : '/dashboard']));
      }

      if (user.role !== 'Student' || (!allowedAcademicStages?.length && !requiredAcademicAccessFlag)) {
        return of(true);
      }

      return academicFlowService.getCurrentSummary().pipe(
        map((summary) => {
          if (requiredAcademicAccessFlag && summary[requiredAcademicAccessFlag] === true) {
            return true;
          }

          if (allowedAcademicStages?.includes(summary.currentStage)) {
            return true;
          }

          return router.parseUrl(summary.recommendedRoute || '/dashboard');
        }),
        catchError(() => of(router.createUrlTree(['/dashboard'])))
      );
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
