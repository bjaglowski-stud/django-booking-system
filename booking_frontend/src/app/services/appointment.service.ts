import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppointmentSlot, CalendarEvent } from '../models/types';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = '/api/appointments';

    getAppointments(start?: Date, end?: Date): Observable<CalendarEvent[]> {
        let url = this.apiUrl + '/';
        const params: string[] = [];

        if (start) {
            params.push(`start=${start.toISOString()}`);
        }
        if (end) {
            params.push(`end=${end.toISOString()}`);
        }

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<AppointmentSlot[]>(url).pipe(
            map(slots => this.convertSlotsToEvents(slots))
        );
    }

    createAppointment(start: Date): Observable<AppointmentSlot> {
        return this.http.post<AppointmentSlot>(
            this.apiUrl + '/',
            { start: start.toISOString() },
            { headers: this.authService.getAuthHeaders() }
        );
    }

    deleteAppointment(id: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${id}/`,
            { headers: this.authService.getAuthHeaders() }
        );
    }

    private convertSlotsToEvents(slots: AppointmentSlot[]): CalendarEvent[] {
        return slots.map(slot => {
            const slotDate = new Date(slot.start);
            const endDate = new Date(slotDate.getTime() + 60 * 60 * 1000); // +1 hour

            let title: string;
            let backgroundColor: string;
            let borderColor: string;

            if (slot.is_booked) {
                title = `Zajęte - ${slot.doctor || 'Lekarz'}`;
                backgroundColor = '#dc3545';
                borderColor = '#dc3545';
            } else {
                title = `Wolne - ${slot.doctor || 'Lekarz'}`;
                backgroundColor = '#28a745';
                borderColor = '#28a745';
            }

            return {
                id: slot.id.toString(),
                title,
                start: slot.start,
                end: endDate.toISOString(),
                backgroundColor,
                borderColor,
                extendedProps: {
                    slotId: slot.id,
                    isBooked: slot.is_booked,
                    doctorName: slot.doctor || undefined
                }
            };
        });
    }
}
