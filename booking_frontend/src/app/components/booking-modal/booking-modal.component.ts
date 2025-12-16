import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Rezerwacja wizyty</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          @if (slotInfo) {
            <div class="mb-3">
              <p><strong>Termin:</strong> {{ formatDate(slotInfo.start) }}</p>
              <p><strong>Lekarz:</strong> {{ slotInfo.doctorName }}</p>
            </div>
          }

          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="reason" class="form-label">Powód wizyty *</label>
              <textarea
                id="reason"
                class="form-control"
                formControlName="reason"
                rows="3"
                placeholder="Opisz powód wizyty..."
                [class.is-invalid]="bookingForm.get('reason')?.invalid && bookingForm.get('reason')?.touched">
              </textarea>
              @if (bookingForm.get('reason')?.errors?.['required'] && bookingForm.get('reason')?.touched) {
                <div class="invalid-feedback">Powód wizyty jest wymagany</div>
              }
              @if (bookingForm.get('reason')?.errors?.['minlength'] && bookingForm.get('reason')?.touched) {
                <div class="invalid-feedback">Powód wizyty musi mieć minimum 3 znaki</div>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">{{ errorMessage() }}</div>
            }

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="bookingForm.invalid || isSubmitting()">
                @if (isSubmitting()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                }
                {{ isSubmitting() ? 'Rezerwowanie...' : 'Zarezerwuj' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; }
    .modal-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 1050; width: 90%; max-width: 500px; }
    .modal-content { background: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); padding: 20px; }
    .modal-header { border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.5; }
    .btn-close:hover { opacity: 1; }
  `]
})
export class BookingModalComponent implements OnInit {
  @Input() slotId: number | null = null;
  @Input() slotInfo: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() bookingCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private notificationService = inject(NotificationService);

  errorMessage = signal('');
  isSubmitting = signal(false);

  bookingForm: FormGroup;

  constructor() {
    this.bookingForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.bookingForm.invalid || !this.slotId) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const reason = this.bookingForm.value.reason;

    this.bookingService.createBooking(this.slotId, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notificationService.success('Wizyta została pomyślnie zarezerwowana!');
        this.bookingCreated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.detail || err.error?.reason?.[0] || 'Wystąpił błąd podczas rezerwacji';
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
