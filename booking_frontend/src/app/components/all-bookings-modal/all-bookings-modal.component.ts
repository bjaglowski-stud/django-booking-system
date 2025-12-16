import { Component, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/types';

@Component({
    selector: 'app-all-bookings-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Wszystkie rezerwacje</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          @if (loading()) {
            <div class="text-center">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Ładowanie...</span>
              </div>
            </div>
          } @else if (bookings().length === 0) {
            <p class="text-muted">Brak rezerwacji w systemie.</p>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Lekarz</th>
                    <th>Pacjent</th>
                    <th>Email</th>
                    <th>Powód</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (booking of bookings(); track booking.id) {
                    <tr>
                      <td>{{ booking.id }}</td>
                      <td>{{ formatDate(booking.slot_details?.start) }}</td>
                      <td>{{ booking.slot_details?.doctor_name }}</td>
                      <td>{{ getUserName(booking) }}</td>
                      <td>{{ booking.user_details?.email }}</td>
                      <td>{{ booking.reason }}</td>
                      <td>
                        <span [class]="getStatusClass(booking.status)">
                          {{ getStatusLabel(booking.status) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (errorMessage()) {
            <div class="alert alert-danger mt-3">{{ errorMessage() }}</div>
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onClose()">Zamknij</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; }
    .modal-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 1050; width: 95%; max-width: 1200px; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); padding: 20px; }
    .modal-header { border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .modal-footer { border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.5; }
    .btn-close:hover { opacity: 1; }
    .badge { padding: 0.25em 0.6em; border-radius: 0.25rem; font-weight: 500; }
    .table-sm td, .table-sm th { padding: 0.5rem; }
  `]
})
export class AllBookingsModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();

    private bookingService = inject(BookingService);

    bookings = signal<Booking[]>([]);
    loading = signal(true);
    errorMessage = signal('');

    ngOnInit(): void {
        this.loadBookings();
    }

    loadBookings(): void {
        this.loading.set(true);
        this.bookingService.getAllBookings().subscribe({
            next: (data) => {
                this.bookings.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Błąd podczas ładowania rezerwacji');
                this.loading.set(false);
            }
        });
    }

    onClose(): void {
        this.close.emit();
    }

    formatDate(date: string | undefined): string {
        if (!date) return '-';
        return new Intl.DateTimeFormat('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    getUserName(booking: Booking): string {
        const user = booking.user_details;
        if (!user) return '-';
        const fullName = `${user.first_name} ${user.last_name}`.trim();
        return fullName || user.username;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'pending': 'Oczekująca',
            'confirmed': 'Potwierdzona',
            'cancelled': 'Anulowana'
        };
        return labels[status] || status;
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'pending': 'badge bg-warning',
            'confirmed': 'badge bg-success',
            'cancelled': 'badge bg-secondary'
        };
        return classes[status] || 'badge bg-secondary';
    }
}
