import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, RegisterStudentRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly currentUserState = signal<AuthUser | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  registerStudent(payload: RegisterStudentRequest): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.apiBaseUrl}/auth/register-student`, payload)
      .pipe(tap(() => undefined));
  }

  login(payload: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      tap((user) => {
        this.currentUserState.set(user);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUserState.set(null);
      })
    );
  }

  loadCurrentUser(force = false): Observable<AuthUser | null> {
    if (!force && this.currentUserState()) {
      return of(this.currentUserState());
    }

    return this.http.get<AuthUser>(`${this.apiBaseUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserState.set(user);
      }),
      map((user) => user),
      catchError(() => {
        this.currentUserState.set(null);
        return of(null);
      })
    );
  }
}
