import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { NotificationService } from '../../services/notification.service';
import { Booking } from '../../models/types';

@Component({
    selector: 'app-edit-booking-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edycja wizyty</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          @if (errorMessage() && !booking()) {
            <div class="alert alert-warning">
              {{ errorMessage() }}
            </div>
            <div class="d-flex justify-content-end">
              <button type="button" class="btn btn-secondary" (click)="onClose()">
                Zamknij
              </button>
            </div>
          } @else if (booking()) {
            <div class="mb-3">
              <p><strong>Termin:</strong> {{ formatDate(booking()!.slot_details!.start) }}</p>
              <p><strong>Lekarz:</strong> {{ booking()!.slot_details!.doctor_name }}</p>
            </div>

            <form [formGroup]="editForm" (ngSubmit)="onUpdate()">
              <div class="mb-3">
                <label for="reason" class="form-label">Powód wizyty *</label>
                <textarea
                  id="reason"
                  class="form-control"
                  formControlName="reason"
                  rows="3"
                  placeholder="Opisz powód wizyty..."
                  [class.is-invalid]="editForm.get('reason')?.invalid && editForm.get('reason')?.touched">
                </textarea>
                @if (editForm.get('reason')?.errors?.['required'] && editForm.get('reason')?.touched) {
                  <div class="invalid-feedback">Powód wizyty jest wymagany</div>
                }
                @if (editForm.get('reason')?.errors?.['minlength'] && editForm.get('reason')?.touched) {
                  <div class="invalid-feedback">Powód wizyty musi mieć minimum 3 znaki</div>
                }
              </div>

              @if (errorMessage()) {
                <div class="alert alert-danger">{{ errorMessage() }}</div>
              }

              <div class="d-flex justify-content-end gap-2">
                @if (booking()!.status !== 'cancelled') {
                  <button type="button" class="btn btn-danger" (click)="onCancel()" [disabled]="isSubmitting()">
                    @if (isSubmitting() && cancelingBooking()) {
                      <span class="spinner-border spinner-border-sm me-2"></span>
                    }
                    Anuluj wizytę
                  </button>
                }
                <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">
                  Zamknij
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid || isSubmitting() || booking()!.status === 'cancelled'">
                  @if (isSubmitting() && !cancelingBooking()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  {{ isSubmitting() && !cancelingBooking() ? 'Zapisywanie...' : 'Zapisz zmiany' }}
                </button>
              </div>
            </form>
          } @else {
            <div class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Ładowanie...</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop { 
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      background: rgba(0,0,0,0.5); 
      z-index: 1040; 
    }
    
    .modal-dialog { 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%,-50%); 
      z-index: 1050; 
      width: 90%; 
      max-width: 500px; 
    }
    
    .modal-content { 
      background: white; 
      border-radius: 8px; 
      box-shadow: 0 5px 15px rgba(0,0,0,0.3); 
      padding: 20px; 
    }
    
    .modal-header { 
      border-bottom: 1px solid #dee2e6; 
      padding-bottom: 15px; 
      margin-bottom: 15px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    
    .btn-close { 
      background: none; 
      border: none; 
      font-size: 1.5rem; 
      cursor: pointer; 
      opacity: 0.5; 
    }
    
    .btn-close:hover { 
      opacity: 1; 
    }
  `]
})
export class EditBookingModalComponent implements OnInit {
    @Input() slotId: number | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() bookingUpdated = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private bookingService = inject(BookingService);
    private notificationService = inject(NotificationService);

    booking = signal<Booking | null>(null);
    errorMessage = signal('');
    isSubmitting = signal(false);
    cancelingBooking = signal(false);

    editForm: FormGroup;

    constructor() {
        this.editForm = this.fb.group({
            reason: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    ngOnInit(): void {
        if (this.slotId) {
            this.loadBookingDetails();
        }
    }

    loadBookingDetails(): void {
        if (!this.slotId) return;

        this.bookingService.getBookingsBySlot(this.slotId).subscribe({
            next: (bookings) => {
                if (bookings.length > 0) {
                    this.booking.set(bookings[0]);
                    this.editForm.patchValue({
                        reason: bookings[0].reason
                    });
                } else {
                    // No bookings found - this is not user's booking
                    this.errorMessage.set('To nie jest Twoja wizyta. Możesz edytować tylko swoje wizyty.');
                }
            },
            error: (err) => {
                console.error('Error loading booking details:', err);
                const errorMsg = err.status === 401 || err.status === 403
                    ? 'Musisz być zalogowany aby edytować wizyty'
                    : 'Nie udało się załadować wizyty';
                this.errorMessage.set(errorMsg);
            }
        });
    }

    onUpdate(): void {
        if (this.editForm.invalid || !this.booking()) return;

        this.isSubmitting.set(true);
        this.cancelingBooking.set(false);
        this.errorMessage.set('');

        const reason = this.editForm.value.reason;
        const bookingId = this.booking()!.id;

        this.bookingService.updateBooking(bookingId, reason).subscribe({
            next: (updatedBooking) => {
                this.isSubmitting.set(false);
                this.booking.set(updatedBooking);
                this.notificationService.success('Wizyta została zaktualizowana!');
                this.bookingUpdated.emit();
            },
            error: (err) => {
                this.isSubmitting.set(false);
                const errorMsg = err.error?.detail || err.error?.reason?.[0] || 'Wystąpił błąd podczas aktualizacji';
                this.errorMessage.set(errorMsg);
                this.notificationService.error(errorMsg);
            }
        });
    }

    onCancel(): void {
        if (!this.booking() || !confirm('Czy na pewno chcesz anulować tę wizytę?')) return;

        this.isSubmitting.set(true);
        this.cancelingBooking.set(true);
        this.errorMessage.set('');

        const bookingId = this.booking()!.id;

        this.bookingService.cancelBooking(bookingId).subscribe({
            next: (cancelledBooking) => {
                this.isSubmitting.set(false);
                this.cancelingBooking.set(false);
                this.booking.set(cancelledBooking);
                this.notificationService.success('Wizyta została anulowana');
                this.bookingUpdated.emit();
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.cancelingBooking.set(false);
                const errorMsg = err.error?.detail || 'Wystąpił błąd podczas anulowania wizyty';
                this.errorMessage.set(errorMsg);
                this.notificationService.error(errorMsg);
            }
        });
    }

    onClose(): void {
        this.close.emit();
    }

    formatDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    }
}
