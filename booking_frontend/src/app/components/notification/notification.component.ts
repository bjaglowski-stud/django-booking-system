import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div class="notification notification-{{ notification.type }}" 
             (click)="notificationService.remove(notification.id)">
          <div class="notification-icon">
            @switch (notification.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @case ('info') { ℹ }
            }
          </div>
          <div class="notification-message">{{ notification.message }}</div>
          <button class="notification-close" (click)="notificationService.remove(notification.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      background: white;
      border-left: 4px solid;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-success {
      border-left-color: #28a745;
      background: #d4edda;
      color: #155724;
    }

    .notification-error {
      border-left-color: #dc3545;
      background: #f8d7da;
      color: #721c24;
    }

    .notification-warning {
      border-left-color: #ffc107;
      background: #fff3cd;
      color: #856404;
    }

    .notification-info {
      border-left-color: #17a2b8;
      background: #d1ecf1;
      color: #0c5460;
    }

    .notification-icon {
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .notification-message {
      flex: 1;
      word-break: break-word;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 24px;
      line-height: 1;
      opacity: 0.5;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .notification-close:hover {
      opacity: 1;
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
