import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register-page.component').then((m) => m.RegisterPageComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: {
      roles: ['Student']
    },
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard-page.component').then(
        (m) => m.DashboardPageComponent
      )
  },
  {
    path: 'pretests',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/evaluations/pages/evaluation-list/evaluation-list-page.component').then(
        (m) => m.EvaluationListPageComponent
      ),
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Pretest'],
      assessmentType: 'Pretest',
      title: 'Pretests disponibles'
    }
  },
  {
    path: 'posttests',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/evaluations/pages/evaluation-list/evaluation-list-page.component').then(
        (m) => m.EvaluationListPageComponent
      ),
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Posttest'],
      assessmentType: 'Posttest',
      title: 'Postests disponibles'
    }
  },
  {
    path: 'readings',
    canActivate: [authGuard],
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Readings', 'Posttest']
    },
    loadComponent: () =>
      import('./features/readings/pages/reading-list/reading-list-page.component').then(
        (m) => m.ReadingListPageComponent
      )
  },
  {
    path: 'readings/:readingId',
    canActivate: [authGuard],
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Readings', 'Posttest']
    },
    loadComponent: () =>
      import('./features/readings/pages/reading-detail/reading-detail-page.component').then(
        (m) => m.ReadingDetailPageComponent
      )
  },
  {
    path: 'reading-sessions/:attemptId',
    canActivate: [authGuard],
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Readings', 'Posttest']
    },
    loadComponent: () =>
      import('./features/readings/pages/reading-session/reading-session-page.component').then(
        (m) => m.ReadingSessionPageComponent
      )
  },
  {
    path: 'reading-sessions/:attemptId/result',
    canActivate: [authGuard],
    data: {
      roles: ['Student'],
      allowedAcademicStages: ['Readings', 'Posttest', 'Completed']
    },
    loadComponent: () =>
      import('./features/readings/pages/reading-session-result/reading-session-result-page.component').then(
        (m) => m.ReadingSessionResultPageComponent
      )
  },
  {
    path: 'evaluations/:assessmentId',
    canActivate: [authGuard],
    data: {
      roles: ['Student']
    },
    loadComponent: () =>
      import('./features/evaluations/pages/evaluation-detail/evaluation-detail-page.component').then(
        (m) => m.EvaluationDetailPageComponent
      )
  },
  {
    path: 'attempts/:attemptId/result',
    canActivate: [authGuard],
    data: {
      roles: ['Student']
    },
    loadComponent: () =>
      import('./features/evaluations/pages/attempt-result/attempt-result-page.component').then(
        (m) => m.AttemptResultPageComponent
      )
  },
  {
    path: 'pre-post-comparison',
    canActivate: [authGuard],
    data: {
      roles: ['Student']
    },
    loadComponent: () =>
      import('./features/evaluations/pages/pre-post-comparison/pre-post-comparison-page.component').then(
        (m) => m.PrePostComparisonPageComponent
      )
  },
  {
    path: 'teacher/students',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-student-list/teacher-student-list-page.component').then(
        (m) => m.TeacherStudentListPageComponent
      )
  },
  {
    path: 'teacher/students/:studentId',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-student-detail/teacher-student-detail-page.component').then(
        (m) => m.TeacherStudentDetailPageComponent
      )
  },
  {
    path: 'teacher/content',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/content/pages/content-home/content-home-page.component').then(
        (m) => m.ContentHomePageComponent
      )
  },
  {
    path: 'teacher/content/readings',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/content/pages/content-readings/content-readings-page.component').then(
        (m) => m.ContentReadingsPageComponent
      )
  },
  {
    path: 'teacher/content/assessments',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/content/pages/content-assessments/content-assessments-page.component').then(
        (m) => m.ContentAssessmentsPageComponent
      )
  },
  {
    path: 'teacher/content/questions',
    canActivate: [authGuard],
    data: {
      roles: ['Teacher']
    },
    loadComponent: () =>
      import('./features/content/pages/content-questions/content-questions-page.component').then(
        (m) => m.ContentQuestionsPageComponent
      )
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
