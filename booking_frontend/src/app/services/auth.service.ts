import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of, tap } from 'rxjs';
import { TokenResponse, User } from '../models/types';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = '/api';

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        if (this.hasToken()) {
            this.loadCurrentUser();
        }
    }

    private hasToken(): boolean {
        return !!localStorage.getItem('access_token');
    }

    login(username: string, password: string): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/auth/token/`, { username, password })
            .pipe(
                tap(tokens => {
                    this.storeTokens(tokens);
                    this.isAuthenticatedSubject.next(true);
                    this.loadCurrentUser();
                })
            );
    }

    register(userData: { username: string; password: string; email: string; first_name: string; last_name: string }): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/auth/register/`, userData)
            .pipe(
                tap(tokens => {
                    this.storeTokens(tokens);
                    this.isAuthenticatedSubject.next(true);
                    this.loadCurrentUser();
                })
            );
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
    }

    private storeTokens(tokens: TokenResponse): void {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    }

    getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    isAuthenticated(): boolean {
        return this.hasToken();
    }

    loadCurrentUser(): void {
        this.http.get<User>(`${this.apiUrl}/auth/me/`, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (user) => this.currentUserSubject.next(user),
                error: () => this.logout()
            });
    }

    checkIfAdministrator(): Observable<boolean> {
        return this.http.get(`${this.apiUrl}/bookings/all_bookings/`, {
            headers: this.getAuthHeaders(),
            observe: 'response'
        }).pipe(
            map(response => response.ok),
            catchError(() => of(false))
        );
    }

    checkIfDoctor(): Observable<boolean> {
        return this.http.options(`${this.apiUrl}/appointments/`, {
            headers: this.getAuthHeaders(),
            observe: 'response'
        }).pipe(
            map(response => response.ok),
            catchError(() => of(false))
        );
    }
}
