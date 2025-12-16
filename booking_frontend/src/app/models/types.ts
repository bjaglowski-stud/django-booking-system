export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface AppointmentSlot {
    id: number;
    start: string;
    doctor: string | null;
    is_booked: boolean;
}

export interface Booking {
    id: number;
    slot: number;
    user: number;
    reason: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    slot_details?: {
        id: number;
        start: string;
        doctor_name: string;
    };
    user_details?: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface TokenResponse {
    access: string;
    refresh: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: {
        slotId: number;
        isBooked: boolean;
        doctorName?: string;
        bookingDetails?: Booking;
    };
}
