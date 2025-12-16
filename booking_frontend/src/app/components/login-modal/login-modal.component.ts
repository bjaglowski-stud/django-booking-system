import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Logowanie</h5>
          <button type="button" class="btn-close" (click)="onClose()"></button>
        </div>
        <div class="modal-body">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="username" class="form-label">Nazwa użytkownika *</label>
              <input
                type="text"
                id="username"
                class="form-control"
                formControlName="username"
                [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
                <div class="invalid-feedback">Nazwa użytkownika jest wymagana</div>
              }
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Hasło *</label>
              <input
                type="password"
                id="password"
                class="form-control"
                formControlName="password"
                [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <div class="invalid-feedback">Hasło jest wymagane</div>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">{{ errorMessage() }}</div>
            }

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="loginForm.invalid || isSubmitting()">
                @if (isSubmitting()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                }
                {{ isSubmitting() ? 'Logowanie...' : 'Zaloguj' }}
              </button>
            </div>
          </form>
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
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }
    .modal-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1050;
      width: 90%;
      max-width: 400px;
    }
    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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
export class LoginModalComponent {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  errorMessage = signal('');
  isSubmitting = signal(false);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notificationService.success('Zalogowano pomyślnie!');
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.detail || 'Nieprawidłowa nazwa użytkownika lub hasło';
        this.errorMessage.set(errorMsg);
        this.notificationService.error(errorMsg);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
