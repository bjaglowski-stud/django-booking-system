import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/types';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { RegisterModalComponent } from '../register-modal/register-modal.component';
import { MyBookingsModalComponent } from '../my-bookings-modal/my-bookings-modal.component';
import { AllBookingsModalComponent } from '../all-bookings-modal/all-bookings-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LoginModalComponent, RegisterModalComponent, MyBookingsModalComponent, AllBookingsModalComponent],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Gabinet - Rezerwacje</a>
        <button class="navbar-toggler" type="button" (click)="toggleNavbar()">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" [class.show]="showNav()">
          <ul class="navbar-nav ms-auto">
            @if (!isAuthenticated()) {
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" (click)="onLogin()">Zaloguj się</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" (click)="onRegister()">Zarejestruj się</a>
              </li>
            }
            @if (isAuthenticated()) {
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" (click)="onShowMyBookings()">Moje rezerwacje</a>
              </li>
              @if (isAdministrator()) {
                <li class="nav-item">
                  <a class="nav-link" href="javascript:void(0)" (click)="onShowAllBookings()">Wszystkie rezerwacje</a>
                </li>
              }
              <li class="nav-item">
                <span class="navbar-text me-3">{{ getUserDisplayName() }}</span>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" (click)="onLogout()">Wyloguj</a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>

    @if (showLoginModal()) {
      <app-login-modal (close)="showLoginModal.set(false)"></app-login-modal>
    }

    @if (showRegisterModal()) {
      <app-register-modal (close)="showRegisterModal.set(false)"></app-register-modal>
    }

    @if (showMyBookingsModal()) {
      <app-my-bookings-modal (close)="showMyBookingsModal.set(false)"></app-my-bookings-modal>
    }

    @if (showAllBookingsModal()) {
      <app-all-bookings-modal (close)="showAllBookingsModal.set(false)"></app-all-bookings-modal>
    }
  `,
  styles: [`
    nav {
      box-shadow: 0 2px 4px rgba(0,0,0,.1);
    }
    .navbar-text {
      color: rgba(0, 0, 0, 0.7);
      font-weight: 500;
    }
  `]
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);

  showNav = signal(false);
  isAuthenticated = signal(false);
  isAdministrator = signal(false);
  currentUser = signal<User | null>(null);

  showLoginModal = signal(false);
  showRegisterModal = signal(false);
  showMyBookingsModal = signal(false);
  showAllBookingsModal = signal(false);

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
      if (isAuth) {
        this.loadUserInfo();
      } else {
        this.currentUser.set(null);
        this.isAdministrator.set(false);
      }
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  toggleNavbar(): void {
    this.showNav.update(v => !v);
  }

  loadUserInfo(): void {
    this.authService.loadCurrentUser();
    this.authService.checkIfAdministrator().subscribe(isAdmin => {
      this.isAdministrator.set(isAdmin);
    });
  }

  onLogin(): void {
    this.showLoginModal.set(true);
  }

  onRegister(): void {
    this.showRegisterModal.set(true);
  }

  onLogout(): void {
    this.authService.logout();
  }

  openLoginModal(): void {
    this.onLogin();
  }

  onShowMyBookings(): void {
    this.showMyBookingsModal.set(true);
  }

  onShowAllBookings(): void {
    this.showAllBookingsModal.set(true);
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return '';
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.username;
  }
}
