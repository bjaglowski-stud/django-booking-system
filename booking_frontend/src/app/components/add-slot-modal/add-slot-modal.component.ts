import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-add-slot-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Dodaj nowy termin</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          <form [formGroup]="slotForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="datetime" class="form-label">Data i godzina *</label>
              <input
                type="datetime-local"
                id="datetime"
                class="form-control"
                formControlName="datetime"
                [class.is-invalid]="slotForm.get('datetime')?.invalid && slotForm.get('datetime')?.touched">
              @if (slotForm.get('datetime')?.invalid && slotForm.get('datetime')?.touched) {
                <div class="invalid-feedback">Data i godzina są wymagane</div>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">{{ errorMessage() }}</div>
            }

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="slotForm.invalid || isSubmitting()">
                @if (isSubmitting()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                }
                {{ isSubmitting() ? 'Dodawanie...' : 'Dodaj termin' }}
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
export class AddSlotModalComponent implements OnInit {
  @Input() selectedDate: Date | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() slotCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private notificationService = inject(NotificationService);

  errorMessage = signal('');
  isSubmitting = signal(false);

  slotForm: FormGroup;

  constructor() {
    this.slotForm = this.fb.group({
      datetime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.selectedDate) {
      const dateStr = this.formatDateTimeLocal(this.selectedDate);
      this.slotForm.patchValue({ datetime: dateStr });
    }
  }

  onSubmit(): void {
    if (this.slotForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const datetime = new Date(this.slotForm.value.datetime);

    this.appointmentService.createAppointment(datetime).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notificationService.success('Termin został pomyślnie dodany!');
        this.slotCreated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.detail || err.error?.start?.[0] || 'Wystąpił błąd podczas dodawania terminu';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
