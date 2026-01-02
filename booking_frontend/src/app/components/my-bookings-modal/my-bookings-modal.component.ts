import { Component, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Booking } from '../../models/types';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-my-bookings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Moje rezerwacje</h5>
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
            <p class="text-muted">Nie masz żadnych rezerwacji.</p>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Data</th>
                    @if (isDoctor()) {
                      <th>Pacjent</th>
                    } @else {
                      <th>Lekarz</th>
                    }
                    <th>Powód</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  @for (booking of paginatedBookings(); track booking.id) {
                    <tr class="booking-row">
                      <td>{{ formatDate(booking.slot_details?.start) }}</td>
                      @if (isDoctor()) {
                        <td>{{ booking.user_details?.first_name }} {{ booking.user_details?.last_name }}</td>
                      } @else {
                        <td>{{ booking.slot_details?.doctor_name }}</td>
                      }
                      <td>
                        @if (editingBookingId() === booking.id && !isDoctor()) {
                          <input 
                            type="text" 
                            class="form-control form-control-sm" 
                            [(ngModel)]="editReason"
                            (keyup.enter)="saveReason(booking.id)"
                            (keyup.escape)="cancelEdit()">
                        } @else {
                          <span>{{ booking.reason }}</span>
                        }
                      </td>
                      <td>
                        <span [class]="getStatusClass(booking.status)">
                          {{ getStatusLabel(booking.status) }}
                        </span>
                      </td>
                      <td>
                        @if (booking.status !== 'cancelled') {
                          @if (editingBookingId() === booking.id && !isDoctor()) {
                            <button class="btn btn-sm btn-success me-1" (click)="saveReason(booking.id)">
                              Zapisz
                            </button>
                            <button class="btn btn-sm btn-secondary me-1" (click)="cancelEdit()">
                              Anuluj
                            </button>
                          } @else {
                            @if (!isDoctor()) {
                              <button class="btn btn-sm btn-primary me-1" (click)="editBooking(booking)">
                                Edytuj
                              </button>
                            }
                          }
                          <button class="btn btn-sm btn-danger" (click)="cancelBooking(booking.id)">
                            Anuluj wizytę
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <nav aria-label="Nawigacja stron">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" [class.disabled]="currentPage() === 1">
                    <a class="page-link" href="javascript:void(0)" (click)="goToPage(currentPage() - 1)">
                      Poprzednia
                    </a>
                  </li>
                  @for (page of pages; track page) {
                    <li class="page-item" [class.active]="currentPage() === page">
                      <a class="page-link" href="javascript:void(0)" (click)="goToPage(page)">
                        {{ page }}
                      </a>
                    </li>
                  }
                  <li class="page-item" [class.disabled]="currentPage() === totalPages()">
                    <a class="page-link" href="javascript:void(0)" (click)="goToPage(currentPage() + 1)">
                      Następna
                    </a>
                  </li>
                </ul>
              </nav>
            }
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
    .modal-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 1050; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); padding: 20px; }
    .modal-header { border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .modal-footer { border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.5; }
    .btn-close:hover { opacity: 1; }
    .badge { padding: 0.25em 0.6em; border-radius: 0.25rem; font-weight: 500; }
    .pagination { margin-top: 1rem; }
    .booking-row { cursor: pointer; }
    .booking-row:hover { background-color: #f8f9fa; }
  `]
})
export class MyBookingsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  bookings = signal<Booking[]>([]);
  paginatedBookings = signal<Booking[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  isDoctor = signal(false);

  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(1);

  editingBookingId = signal<number | null>(null);
  editReason = '';

  ngOnInit(): void {
    this.checkIfDoctor();
    this.loadBookings();
  }

  checkIfDoctor(): void {
    this.authService.checkIfDoctor().subscribe({
      next: (isDoctor) => this.isDoctor.set(isDoctor)
    });
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (data) => {
        // Sort bookings: active first (by date), cancelled last
        const sorted = data.sort((a, b) => {
          // Cancelled bookings go to the end
          if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
          if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;

          // For same status, sort by date (earliest first)
          const dateA = new Date(a.slot_details?.start || 0).getTime();
          const dateB = new Date(b.slot_details?.start || 0).getTime();
          return dateA - dateB;
        });

        this.bookings.set(sorted);
        this.totalPages.set(Math.ceil(sorted.length / this.pageSize));
        this.updatePaginatedBookings();
        this.loading.set(false);
      },
      error: (err) => {
        const errorMsg = 'Błąd podczas ładowania rezerwacji';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
        this.loading.set(false);
      }
    });
  }

  updatePaginatedBookings(): void {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBookings.set(this.bookings().slice(start, end));
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updatePaginatedBookings();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  cancelBooking(bookingId: number): void {
    if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) return;

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.notificationService.success('Rezerwacja została anulowana');
        this.loadBookings();
      },
      error: (err) => {
        const errorMsg = err.error?.detail || 'Błąd podczas anulowania rezerwacji';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
      }
    });
  }

  editBooking(booking: Booking): void {
    this.editingBookingId.set(booking.id);
    this.editReason = booking.reason;
  }

  cancelEdit(): void {
    this.editingBookingId.set(null);
    this.editReason = '';
  }

  saveReason(bookingId: number): void {
    if (!this.editReason.trim() || this.editReason.length < 3) {
      this.notificationService.error('Powód wizyty musi mieć co najmniej 3 znaki');
      return;
    }

    this.bookingService.updateBooking(bookingId, this.editReason).subscribe({
      next: () => {
        this.notificationService.success('Powód wizyty został zaktualizowany');
        this.editingBookingId.set(null);
        this.editReason = '';
        this.loadBookings();
      },
      error: (err) => {
        const errorMsg = err.error?.detail || err.error?.reason?.[0] || 'Błąd podczas aktualizacji';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
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
