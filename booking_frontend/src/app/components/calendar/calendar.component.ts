import { Component, OnInit, inject, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';
import { AppointmentService } from '../../services/appointment.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { AddSlotModalComponent } from '../add-slot-modal/add-slot-modal.component';
import { EditBookingModalComponent } from '../edit-booking-modal/edit-booking-modal.component';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, FullCalendarModule, BookingModalComponent, AddSlotModalComponent, EditBookingModalComponent],
    template: `
    <div class="calendar-container">
      <full-calendar #calendar [options]="calendarOptions()"></full-calendar>
    </div>

    @if (showBookingModal()) {
      <app-booking-modal 
        [slotId]="selectedSlotId()" 
        [slotInfo]="selectedSlotInfo()"
        (close)="showBookingModal.set(false)"
        (bookingCreated)="onBookingCreated()">
      </app-booking-modal>
    }

    @if (showEditBookingModal()) {
      <app-edit-booking-modal 
        [slotId]="selectedSlotId()"
        (close)="showEditBookingModal.set(false)"
        (bookingUpdated)="onBookingUpdated()">
      </app-edit-booking-modal>
    }

    @if (showAddSlotModal()) {
      <app-add-slot-modal 
        [selectedDate]="selectedSlotDate()"
        (close)="showAddSlotModal.set(false)"
        (slotCreated)="onSlotCreated()">
      </app-add-slot-modal>
    }
  `,
    styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
    private appointmentService = inject(AppointmentService);
    private bookingService = inject(BookingService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
    @Output() loginRequired = new EventEmitter<void>();

    showBookingModal = signal(false);
    showEditBookingModal = signal(false);
    showAddSlotModal = signal(false);
    selectedSlotId = signal<number | null>(null);
    selectedSlotDate = signal<Date | null>(null);
    selectedSlotInfo = signal<any>(null);

    calendarOptions = signal<CalendarOptions>({
        plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        locale: plLocale,
        firstDay: 1,
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00:00',
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        selectable: true,
        selectMirror: true,
        editable: false,
        displayEventEnd: false,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        events: (info, successCallback, failureCallback) => {
            this.loadEvents(info.start, info.end, successCallback, failureCallback);
        },
        eventClick: (info) => this.handleEventClick(info),
        select: (info) => this.handleDateSelect(info),
        eventDidMount: (arg) => this.customizeEventDisplay(arg)
    });

    ngOnInit(): void { }

    loadEvents(start: Date, end: Date, successCallback: Function, failureCallback: Function): void {
        this.appointmentService.getAppointments(start, end).subscribe({
            next: (events) => successCallback(events),
            error: (err) => {
                console.error('Error loading events:', err);
                failureCallback(err);
            }
        });
    }

    handleEventClick(clickInfo: EventClickArg): void {
        const slotId = parseInt(clickInfo.event.id);
        const isBooked = clickInfo.event.extendedProps['isBooked'];

        if (isBooked) {
            // Show edit modal for booked slots (requires authentication)
            if (!this.authService.isAuthenticated()) {
                this.loginRequired.emit();
                return;
            }
            this.selectedSlotId.set(slotId);
            this.showEditBookingModal.set(true);
        } else {
            if (!this.authService.isAuthenticated()) {
                // Przekieruj do logowania jeśli użytkownik nie jest zalogowany
                this.loginRequired.emit();
                return;
            }

            this.selectedSlotId.set(slotId);
            this.selectedSlotInfo.set({
                title: clickInfo.event.title,
                start: clickInfo.event.start,
                doctorName: clickInfo.event.extendedProps['doctorName']
            });
            this.showBookingModal.set(true);
        }
    }

    handleDateSelect(selectInfo: DateSelectArg): void {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.authService.checkIfDoctor().subscribe({
            next: (isDoctor) => {
                if (isDoctor) {
                    this.selectedSlotDate.set(selectInfo.start);
                    this.showAddSlotModal.set(true);
                }
            }
        });
    }

    customizeEventDisplay(info: any): void {
        const isNarrowScreen = window.innerWidth <= 768;
        const isMonthView = info.view.type === 'dayGridMonth';
        const doctorName = info.event.extendedProps['doctorName'];
        const titleEl = info.el.querySelector('.fc-event-title');

        if (!titleEl || !doctorName) return;

        // Narrow screen: show time + initials
        if (isNarrowScreen) {
            const nameParts = doctorName.split(' ');
            const initials = nameParts
                .map((part: string) => part.charAt(0).toUpperCase())
                .join('');

            titleEl.textContent = `${initials} `;
            return;
        }

        // Month view on wide screen: show only first name
        if (isMonthView) {
            const firstName = doctorName.split(' ')[0];
            const status = info.event.extendedProps['isBooked'] ? 'Zajęte' : 'Wolne';
            titleEl.textContent = ` ${status} - ${firstName}`;
            return;
        }

        // Day/Week view: use default title (full name already in event.title)
    }

    onBookingCreated(): void {
        this.showBookingModal.set(false);
        this.refreshCalendar();
    }

    onBookingUpdated(): void {
        this.showEditBookingModal.set(false);
        this.refreshCalendar();
    }

    onSlotCreated(): void {
        this.showAddSlotModal.set(false);
        this.refreshCalendar();
    }

    refreshCalendar(): void {
        // Use FullCalendar API to refetch events
        if (this.calendarComponent) {
            const calendarApi = this.calendarComponent.getApi();
            calendarApi.refetchEvents();
        }
    }
}
