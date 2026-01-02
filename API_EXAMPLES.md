# Przykłady użycia API - Django Booking System

Przykłady wywołań API za pomocą curl. Domyślnie API dostępne na `http://localhost/api/`

## 1. Rejestracja użytkownika

```bash
curl -X POST http://localhost/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jan_kowalski",
    "password": "bezpieczne_haslo123",
    "email": "jan@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski"
  }'
```

**Odpowiedź:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 2. Logowanie

```bash
curl -X POST http://localhost/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jan_kowalski",
    "password": "bezpieczne_haslo123"
  }'
```

**Odpowiedź:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Pobierz informacje o zalogowanym użytkowniku:**
```bash
curl -X GET http://localhost/api/auth/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## 3. Wyświetlenie dostępnych terminów

**Lista wszystkich dostępnych terminów (nie wymaga logowania):**
```bash
curl -X GET http://localhost/api/appointments/
```

**Z filtrowaniem dat:**
```bash
curl -X GET "http://localhost/api/appointments/?start=2025-12-30T00:00:00Z&end=2026-01-10T23:59:59Z"
```

**Odpowiedź:**
```json
[
  {
    "id": 1,
    "start": "2025-12-30T10:00:00Z",
    "doctor": "Dr. Anna Nowak",
    "is_booked": false
  },
  {
    "id": 2,
    "start": "2025-12-30T11:00:00Z",
    "doctor": "Dr. Piotr Zieliński",
    "is_booked": true
  }
]
```

---

## 4. Utworzenie nowego terminu (tylko dla lekarzy)

**Uwaga:** Użytkownik musi należeć do grupy "doctor" lub "administrator"

```bash
curl -X POST http://localhost/api/appointments/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{
    "start": "2025-12-31T14:00:00Z"
  }'
```

**Odpowiedź:**
```json
{
  "id": 15,
  "start": "2025-12-31T14:00:00Z",
  "doctor": "Dr. Anna Nowak",
  "is_booked": false
}
```

---

## 5. Zarezerwowanie terminu

**Wymaga autoryzacji (zalogowany użytkownik):**

```bash
curl -X POST http://localhost/api/bookings/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{
    "slot": 15,
    "reason": "Badanie kontrolne - ból głowy"
  }'
```

**Odpowiedź:**
```json
{
  "id": 42,
  "slot": 15,
  "user": 5,
  "reason": "Badanie kontrolne - ból głowy",
  "status": "confirmed",
  "slot_details": {
    "id": 15,
    "start": "2025-12-31T14:00:00Z",
    "doctor_name": "Dr. Anna Nowak"
  },
  "user_details": {
    "id": 5,
    "username": "jan_kowalski",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@example.com"
  }
}
```

---

## 6. Edycja terminu (zmiana powodu wizyty)

**Można edytować tylko własne wizyty:**

```bash
curl -X PATCH http://localhost/api/bookings/42/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{
    "reason": "Konsultacja - wyniki badań laboratoryjnych"
  }'
```

**Odpowiedź:**
```json
{
  "id": 42,
  "slot": 15,
  "user": 5,
  "reason": "Konsultacja - wyniki badań laboratoryjnych",
  "status": "confirmed",
  "slot_details": {
    "id": 15,
    "start": "2025-12-31T14:00:00Z",
    "doctor_name": "Dr. Anna Nowak"
  },
  "user_details": {
    "id": 5,
    "username": "jan_kowalski",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@example.com"
  }
}
```

---

## 7. Anulowanie terminu

**Można anulować tylko własne wizyty:**

```bash
curl -X POST http://localhost/api/bookings/42/cancel/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

**Odpowiedź:**
```json
{
  "id": 42,
  "slot": 15,
  "user": 5,
  "reason": "Konsultacja - wyniki badań laboratoryjnych",
  "status": "cancelled",
  "slot_details": {
    "id": 15,
    "start": "2025-12-31T14:00:00Z",
    "doctor_name": "Dr. Anna Nowak"
  },
  "user_details": {
    "id": 5,
    "username": "jan_kowalski",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@example.com"
  }
}
```

---

## 8. Wyświetlenie własnych wizyt

**Lista wszystkich wizyt zalogowanego użytkownika:**

Dla **pacjentów** - zwraca wizyty, które zarezerwowali:
```bash
curl -X GET http://localhost/api/bookings/mine/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

Dla **lekarzy** - zwraca wizyty pacjentów na ich terminy:
```bash
curl -X GET http://localhost/api/bookings/mine/ \
  -H "Authorization: Bearer DOCTOR_TOKEN..."
```

**Odpowiedź:**
```json
[
  {
    "id": 42,
    "slot": 15,
    "user": 5,
    "reason": "Konsultacja - wyniki badań laboratoryjnych",
    "status": "cancelled",
    "slot_details": {
      "id": 15,
      "start": "2025-12-31T14:00:00Z",
      "doctor_name": "Dr. Anna Nowak"
    },
    "user_details": {
      "id": 5,
      "username": "jan_kowalski",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "email": "jan@example.com"
    }
  },
  {
    "id": 38,
    "slot": 12,
    "user": 5,
    "reason": "Wizyta kontrolna",
    "status": "confirmed",
    "slot_details": {
      "id": 12,
      "start": "2025-12-30T09:00:00Z",
      "doctor_name": "Dr. Piotr Zieliński"
    },
    "user_details": {
      "id": 5,
      "username": "jan_kowalski",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "email": "jan@example.com"
    }
  }
]
```

---

## Dodatkowe operacje

### Sprawdzenie rezerwacji dla konkretnego terminu

**Tylko zalogowani użytkownicy zobaczą swoje własne rezerwacje:**

```bash
curl -X GET "http://localhost/api/bookings/?slot=15" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### Odświeżenie tokenu

**Gdy access token wygaśnie, użyj refresh token:**

```bash
curl -X POST http://localhost/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }'
```

**Odpowiedź:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Usunięcie terminu (tylko dla lekarzy)

```bash
curl -X DELETE http://localhost/api/appointments/15/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## Uwagi

1. **Access token** - używany w nagłówku `Authorization: Bearer <token>`, ważny 1 godzinę
2. **Refresh token** - służy do odświeżenia access token, ważny 1 dzień
3. **Formaty dat** - ISO 8601 format UTC (np. `2025-12-30T14:00:00Z`)
4. **Uprawnienia:**
   - **Zwykły użytkownik (pacjent)**: może rezerwować, edytować i anulować własne wizyty
   - **Lekarz (grupa "doctor")**: 
     - Może tworzyć i usuwać terminy
     - W endpoint `/bookings/mine/` widzi wizyty pacjentów na swoje terminy (nie własne rezerwacje jako pacjent)
     - Może anulować rezerwacje pacjentów na swoje terminy
   - **Administrator (grupa "administrator")**: pełny dostęp do wszystkich zasobów
5. **Endpoint `/bookings/mine/`**:
   - Dla pacjentów: zwraca ich własne zarezerwowane wizyty
   - Dla lekarzy: zwraca wizyty pacjentów na terminy przypisane do lekarza

## Kody odpowiedzi HTTP

- `200 OK` - Sukces (GET, PATCH, DELETE)
- `201 Created` - Zasób utworzony (POST)
- `400 Bad Request` - Błędne dane wejściowe
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `403 Forbidden` - Brak uprawnień do wykonania operacji
- `404 Not Found` - Zasób nie istnieje
