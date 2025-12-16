import { Component, OnInit, inject, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';
import { AppointmentService } from '../../services/appointment.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { AddSlotModalComponent } from '../add-slot-modal/add-slot-modal.component';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, FullCalendarModule, BookingModalComponent, AddSlotModalComponent],
    template: `
    <div class="calendar-container">
      <full-calendar [options]="calendarOptions()"></full-calendar>
    </div>

    @if (showBookingModal()) {
      <app-booking-modal 
        [slotId]="selectedSlotId()" 
        [slotInfo]="selectedSlotInfo()"
        (close)="showBookingModal.set(false)"
        (bookingCreated)="onBookingCreated()">
      </app-booking-modal>
    }

    @if (showAddSlotModal()) {
      <app-add-slot-modal 
        [selectedDate]="selectedSlotDate()"
        (close)="showAddSlotModal.set(false)"
        (slotCreated)="onSlotCreated()">
      </app-add-slot-modal>
    }
  `,
    styles: [`
    .calendar-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 20px;
    }
    
    :host ::ng-deep .fc-timegrid-slot {
      height: 4em !important;
    }
  `]
})
export class CalendarComponent implements OnInit {
    private appointmentService = inject(AppointmentService);
    private bookingService = inject(BookingService);
    private authService = inject(AuthService);

    @Output() loginRequired = new EventEmitter<void>();

    showBookingModal = signal(false);
    showAddSlotModal = signal(false);
    selectedSlotId = signal<number | null>(null);
    selectedSlotDate = signal<Date | null>(null);
    selectedSlotInfo = signal<any>(null);

    calendarOptions = signal<CalendarOptions>({
        plugins: [timeGridPlugin, interactionPlugin],
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
            right: 'timeGridWeek,timeGridDay'
        },
        selectable: true,
        selectMirror: true,
        editable: false,
        events: (info, successCallback, failureCallback) => {
            this.loadEvents(info.start, info.end, successCallback, failureCallback);
        },
        eventClick: (info) => this.handleEventClick(info),
        select: (info) => this.handleDateSelect(info)
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
            this.loadBookingDetails(slotId);
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

    loadBookingDetails(slotId: number): void {
        this.bookingService.getBookingsBySlot(slotId).subscribe({
            next: (bookings) => {
                if (bookings.length > 0) {
                    const booking = bookings[0];
                    alert(`Wizyta zarezerwowana przez: ${booking.user_details?.first_name} ${booking.user_details?.last_name}\nPowód: ${booking.reason}`);
                }
            },
            error: (err) => console.error('Error loading booking details:', err)
        });
    }

    onBookingCreated(): void {
        this.showBookingModal.set(false);
        this.refreshCalendar();
    }

    onSlotCreated(): void {
        this.showAddSlotModal.set(false);
        this.refreshCalendar();
    }

    refreshCalendar(): void {
        // Trigger calendar refetch by updating the options
        const currentOptions = this.calendarOptions();
        this.calendarOptions.set({ ...currentOptions });
    }
}
