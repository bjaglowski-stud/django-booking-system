import { Component, signal, ViewChild } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { NotificationComponent } from './components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, CalendarComponent, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Booking System');

  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  onLoginRequired(): void {
    this.navbar.openLoginModal();
  }
}
