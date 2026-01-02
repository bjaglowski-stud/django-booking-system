import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/types';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = '/api/bookings';

    getBookingsBySlot(slotId: number): Observable<Booking[]> {
        return this.http.get<Booking[]>(
            `${this.apiUrl}/?slot=${slotId}`,
            { headers: this.authService.getAuthHeaders() }
        );
    }

    getMyBookings(): Observable<Booking[]> {
        return this.http.get<Booking[]>(
            `${this.apiUrl}/mine/`,
            { headers: this.authService.getAuthHeaders() }
        );
    }

    getAllBookings(): Observable<Booking[]> {
        return this.http.get<Booking[]>(
            `${this.apiUrl}/all_bookings/`,
            { headers: this.authService.getAuthHeaders() }
        );
    }

    createBooking(slotId: number, reason: string): Observable<Booking> {
        return this.http.post<Booking>(
            this.apiUrl + '/',
            { slot: slotId, reason },
            { headers: this.authService.getAuthHeaders() }
        );
    }

    updateBooking(bookingId: number, reason: string): Observable<Booking> {
        return this.http.patch<Booking>(
            `${this.apiUrl}/${bookingId}/`,
            { reason },
            { headers: this.authService.getAuthHeaders() }
        );
    }

    cancelBooking(bookingId: number): Observable<Booking> {
        return this.http.post<Booking>(
            `${this.apiUrl}/${bookingId}/cancel/`,
            {},
            { headers: this.authService.getAuthHeaders() }
        );
    }
}
