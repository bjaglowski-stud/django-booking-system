import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Rejestracja</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="username" class="form-label">Nazwa użytkownika *</label>
              <input type="text" id="username" class="form-control" formControlName="username"
                [class.is-invalid]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
              @if (registerForm.get('username')?.invalid && registerForm.get('username')?.touched) {
                <div class="invalid-feedback">Nazwa użytkownika jest wymagana</div>
              }
            </div>

            <div class="mb-3">
              <label for="email" class="form-label">Email *</label>
              <input type="email" id="email" class="form-control" formControlName="email"
                [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              @if (registerForm.get('email')?.errors?.['required'] && registerForm.get('email')?.touched) {
                <div class="invalid-feedback">Email jest wymagany</div>
              }
              @if (registerForm.get('email')?.errors?.['email'] && registerForm.get('email')?.touched) {
                <div class="invalid-feedback">Nieprawidłowy format email</div>
              }
            </div>

            <div class="mb-3">
              <label for="first_name" class="form-label">Imię *</label>
              <input type="text" id="first_name" class="form-control" formControlName="first_name"
                [class.is-invalid]="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched">
              @if (registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched) {
                <div class="invalid-feedback">Imię jest wymagane</div>
              }
            </div>

            <div class="mb-3">
              <label for="last_name" class="form-label">Nazwisko *</label>
              <input type="text" id="last_name" class="form-control" formControlName="last_name"
                [class.is-invalid]="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched">
              @if (registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched) {
                <div class="invalid-feedback">Nazwisko jest wymagane</div>
              }
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Hasło *</label>
              <input type="password" id="password" class="form-control" formControlName="password"
                [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              @if (registerForm.get('password')?.errors?.['required'] && registerForm.get('password')?.touched) {
                <div class="invalid-feedback">Hasło jest wymagane</div>
              }
              @if (registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched) {
                <div class="invalid-feedback">Hasło musi mieć minimum 6 znaków</div>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">{{ errorMessage() }}</div>
            }

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="registerForm.invalid || isSubmitting()">
                @if (isSubmitting()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                }
                {{ isSubmitting() ? 'Rejestracja...' : 'Zarejestruj' }}
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
export class RegisterModalComponent {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  errorMessage = signal('');
  isSubmitting = signal(false);

  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notificationService.success('Rejestracja pomyślna! Zalogowano automatycznie.');
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.detail || 'Błąd podczas rejestracji';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
