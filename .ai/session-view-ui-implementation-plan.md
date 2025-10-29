## Plan implementacji widoku Sesja Nauki

## 1. Przegląd
Widok Sesji Nauki umożliwia prowadzenie konwersacji z AI w kontekście wybranego tematu (topic). Oferuje listę wiadomości (user/AI), panel wizualizacji, pole wprowadzania tekstu z opcjonalnym przyciskiem głosowym, zakończenie sesji oraz wskaźniki stanu. Widok integruje się z endpointami sesji: pobranie szczegółów, pobranie/utworzenie wiadomości oraz zakończenie sesji.

## 2. Routing widoku
- Ścieżka: `/app/sessions/[sessionId]`
- Pliki:
  - `src/pages/app/sessions/[sessionId].astro` – strona Astro montująca główny komponent React
  - `src/components/session/SessionScreen.tsx` – główny komponent widoku

## 3. Struktura komponentów
- `SessionScreen` (komponent kontener)
  - `SessionHeader`
  - `ReviewModeBar` (opcjonalny pasek powtórkowy)
  - `MessageList`
    - `MessageItem` (user | ai)
  - `VisualizationPanel` (zwijany / pełny ekran via portal – w przyszłości)
  - `InputArea` (pole tekstowe + przycisk Wyślij + VoiceButton placeholder)
  - `ErrorState` / `LoadingState` (re-użycie istniejących)

Diagram drzewa (wysoki poziom):
```
SessionScreen
├─ SessionHeader
├─ ReviewModeBar (optional)
├─ MessageList
│  ├─ MessageItem*
├─ VisualizationPanel (collapsible)
└─ InputArea
```

## 4. Szczegóły komponentów
### SessionScreen
- Opis: Kontener odpowiadający za pobranie danych sesji i wiadomości, orkiestrację mutacji (wysyłanie wiadomości, zakończenie sesji), zarządzanie stanem i renderowanie layoutu.
- Główne elementy: `Card`/`div` layout, children komponenty: `SessionHeader`, `ReviewModeBar`, `MessageList`, `VisualizationPanel`, `InputArea`.
- Obsługiwane interakcje:
  - Inicjalne pobranie szczegółów sesji (GET `/api/sessions/{id}`)
  - Pobranie wiadomości (GET `/api/sessions/{id}/messages`)
  - Wysłanie wiadomości (POST `/api/sessions/{id}/messages`)
  - Zakończenie sesji (PUT `/api/sessions/{id}/end`)
- Walidacja:
  - `sessionId` musi być prawidłowym UUID przed wywołaniem API (wstępna walidacja po stronie klienta)
  - Przycisk „Wyślij” zablokowany, gdy sesja zakończona lub pole puste
- Typy: `SessionDetailsDTO`, `SessionMessageDTO`, `SessionViewModel`, `SessionMessageViewModel`, `ApiErrorUiModel`
- Propsy: brak (pobiera `sessionId` z params via Astro/props; alternatywnie przez `useParams` w komponencie pośrednim)

### SessionHeader
- Opis: Pasek nagłówka z tytułem tematu, czasem trwania/znacznikiem stanu i przyciskiem „Zakończ sesję”.
- Główne elementy: `Card/Header`, `Title`, `Badge` status, `Button` End.
- Interakcje:
  - Klik „Zakończ sesję” → potwierdzenie → PUT `/api/sessions/{id}/end`
- Walidacja:
  - Zablokowanie przycisku, gdy już zakończona
- Typy: `SessionViewModel` (topicTitle, startedAt, endedAt, aiSummary)
- Propsy:
  - `session: SessionViewModel`
  - `onEndSession: (summary?: string) => Promise<void>`
  - `isEnding: boolean`

### ReviewModeBar
- Opis: Informuje o trybie powtórkowym/„cofaniu się” (placeholder dla MVP; może wyświetlać informację i przycisk powrotu do głównego kontekstu).
- Główne elementy: `div`/`Alert` w kolorze ostrzegawczym.
- Interakcje: zamknięcie/powrót (callback do rodzica).
- Walidacja: brak.
- Typy: proste pole `isVisible: boolean`; w przyszłości `reviewContext`.
- Propsy: `{ visible: boolean; message?: string; onExit?: () => void }`

### MessageList
- Opis: Lista wiadomości z auto-scroll do dołu; w przyszłości wirtualizacja.
- Główne elementy: `ul`/`div` scrollable; elementy `MessageItem`.
- Interakcje: auto-scroll na nowe wiadomości; opcjonalny przycisk „Przewiń na dół”.
- Walidacja: brak.
- Typy: `SessionMessageViewModel[]`.
- Propsy:
  - `messages: SessionMessageViewModel[]`
  - `isLoading: boolean`
  - `error?: ApiErrorUiModel`
  - `onRetry?: () => void`

### MessageItem
- Opis: Render pojedynczej wiadomości (user/ai, tekst, opcjonalny audio_url od AI).
- Główne elementy: awatar/kierunek, `Card`/`bubble`, tekst, opcjonalny player audio.
- Interakcje: odtwarzanie audio (jeśli `audio_url`).
- Walidacja: typ treści `content.type === 'text'` (zabezpieczenie przed nieobsługiwanymi typami).
- Typy: `SessionMessageViewModel`.
- Propsy: `{ message: SessionMessageViewModel }`

### VisualizationPanel
- The goal: panel na wizualizacje (wykresy, formuły). MVP: placeholder + API do otwierania z wiadomości AI.
- Główne elementy: `Card`, kontener na rysunki/obrazy; przycisk zwijania.
- Interakcje: zwijanie/rozwijanie; w przyszłości „Pełny ekran”.
- Walidacja: brak.
- Typy: w MVP brak dedykowanych, później `VisualizationItem`.
- Propsy: `{ isOpen: boolean; onToggle: () => void }`

### InputArea
- Opis: Pole wprowadzania treści do wysłania do AI, przyciski „Wyślij” i „Głos”.
- Główne elementy: `Input`/`Textarea`, `Button` send, `Button` mic (placeholder), licznik znaków.
- Interakcje:
  - Enter/Ctrl+Enter: wysyłanie
  - Klik „Wyślij”: wysyłanie
  - „Głos”: placeholder (disabled lub noop)
- Walidacja:
  - `text.trim().length > 0`
  - Zablokowane, gdy `session.endedAt` niepuste lub trwa wysyłanie
- Typy: `CreateSessionMessageCommand` (po stronie klienta mapowany do DTO), `MessageContent` (typ `text`)
- Propsy:
  - `{ disabled: boolean; onSend: (text: string) => Promise<void>; isSending: boolean }`

## 5. Typy
- DTO (z `src/types.ts`):
  - `SessionDetailsDTO` (SessionEntity + `topic_title`)
  - `SessionMessageDTO` (id, session_id, sender, content, created_at)
  - `SessionDTO`, `SessionListResponseDTO`, `SessionMessageListResponseDTO`, `CreateSessionMessageCommand`, `MessageContent`, `TextMessageContent`, `MessageSender`
- Nowe ViewModel (UI):
```ts
export interface SessionViewModel {
  id: string;
  topicId: string | null;
  topicTitle: string | null;
  startedAtIso: string;
  endedAtIso: string | null;
  aiSummary: string | null;
}

export interface SessionMessageViewModel {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  createdAtIso: string;
  // Dla optymistycznych wiadomości:
  isOptimistic?: boolean;
  clientId?: string;
}

export interface ApiErrorUiModel {
  code: string;
  message: string;
}
```
- Mapowania DTO → VM:
```ts
function mapSessionDetailsDtoToVm(dto: SessionDetailsDTO): SessionViewModel {
  return {
    id: dto.id,
    topicId: dto.topic_id,
    topicTitle: dto.topic_title ?? null,
    startedAtIso: dto.started_at,
    endedAtIso: dto.ended_at,
    aiSummary: dto.ai_summary,
  };
}

function mapSessionMessageDtoToVm(dto: SessionMessageDTO): SessionMessageViewModel {
  const isText = dto.content && (dto.content as any).type === 'text';
  return {
    id: dto.id,
    sessionId: dto.session_id,
    sender: dto.sender,
    text: isText ? (dto.content as TextMessageContent).text : '',
    audioUrl: isText ? (dto.content as TextMessageContent).audio_url : undefined,
    createdAtIso: dto.created_at,
  };
}
```

## 6. Zarządzanie stanem
- Stany lokalne w `SessionScreen`:
  - `session: SessionViewModel | null`
  - `messages: SessionMessageViewModel[]`
  - `isLoadingSession: boolean`, `sessionError?: ApiErrorUiModel`
  - `isLoadingMessages: boolean`, `messagesError?: ApiErrorUiModel`
  - `isSending: boolean`, `isEnding: boolean`
  - `isVisualizationOpen: boolean`
- Custom hooki:
  - `useSession(sessionId)` – pobiera szczegóły; zwraca `{ data, isLoading, error, refetch }`
  - `useSessionMessages(sessionId, opts)` – pobiera listę; paginacja `limit/offset`; zwraca `{ messages, isLoading, error, fetchMore, refetch }`
  - `useAutoScroll(deps)` – przewija listę przy nowych wiadomościach
  - `useSendMessage(sessionId)` – mutacja POST z optymistycznym dodaniem (tymczasowe `clientId`), rollback przy błędzie
  - `useEndSession(sessionId)` – mutacja PUT `/end`, aktualizacja `endedAtIso`

## 7. Integracja API
- Autoryzacja: cookies/sesja (jak w `profile.client.ts`), `credentials: 'same-origin'` i `Content-Type: application/json`.
- Endpoints (wg planu API):
  - GET `/api/sessions/{sessionId}` → `SessionDetailsDTO`
  - GET `/api/sessions/{sessionId}/messages?limit=50&offset=0&order=asc` → `SessionMessageListResponseDTO`
  - POST `/api/sessions/{sessionId}/messages` body: `CreateSessionMessageCommand` → `SessionMessageDTO`
  - PUT `/api/sessions/{sessionId}/end` body: `{ ai_summary: string }` → `SessionDetailsDTO`
- Klient API: `src/lib/api/sessions.client.ts`
```ts
export async function fetchSessionDetails(sessionId: string): Promise<SessionViewModel> { /* ... */ }
export async function fetchSessionMessages(sessionId: string, q?: {limit?: number; offset?: number; order?: 'asc'|'desc';}): Promise<{messages: SessionMessageViewModel[]; total: number; limit: number; offset: number;}> { /* ... */ }
export async function postSessionMessage(sessionId: string, text: string, sender: 'user'|'ai' = 'user'): Promise<SessionMessageViewModel> { /* ... */ }
export async function endSession(sessionId: string, aiSummary: string): Promise<SessionViewModel> { /* ... */ }
```
- Błędy API: parsowanie `ApiErrorResponseDTO` → `ApiErrorUiModel` (analogicznie do `profile.client.ts`).

## 8. Interakcje użytkownika
- Wejście na `/app/sessions/{id}` → ładowanie szczegółów; w razie 404/403/401 odpowiednie stany (opis w sekcji błędów).
- Przewijanie listy wiadomości (auto-scroll na dół przy nowych wiadomościach).
- Wysyłanie wiadomości:
  - Walidacja niepustej treści
  - Dodanie optymistyczne do listy (status wysyłania)
  - Po sukcesie podmiana na rekord z serwera; po błędzie rollback i toast
- Zakończenie sesji:
  - Potwierdzenie (modal/confirm)
  - Po sukcesie: ustawienie `endedAtIso`, zablokowanie `InputArea`, pokazanie `aiSummary` (jeśli dostępne)
- Panel wizualizacji: rozwijanie/zwijanie (MVP placeholder)

## 9. Warunki i walidacja
- `sessionId` musi być UUID: przed pierwszym fetch sprawdzenie (np. prosty regex/`zod`), w razie błędu – stan „Nieprawidłowy identyfikator sesji”.
- Input nie może być pusty: `text.trim().length > 0`; max długość np. 4000 znaków (soft limit w UI z licznikiem).
- Wysyłanie wiadomości dozwolone wyłącznie, gdy `endedAtIso === null` i brak trwającej mutacji.
- Parametry zapytań (limit/offset/order) walidowane po stronie klienta (typy i zakresy: `limit` 1–200; `offset` ≥ 0; `order` w {asc, desc}).

## 10. Obsługa błędów
- 401 Unauthorized: przekierowanie do `/auth/login` lub komunikat i przycisk „Zaloguj ponownie”.
- 403 Forbidden: komunikat „Brak dostępu do tej sesji”.
- 404 Not Found: „Sesja nie została znaleziona”.
- 400 Invalid Input: pokazanie komunikatu z API (`error.message`).
- 500/Network: toast z możliwością ponowienia prób (`onRetry`).
- Błędy walidacji UI: disabled controls + inline help text.

## 11. Kroki implementacji
1. Routing:
   - Utwórz `src/pages/app/sessions/[sessionId].astro` montujący `SessionScreen` z przekazaniem `sessionId` (z params).
2. Typy i mapowania:
   - Dodaj `src/lib/types/session-view.types.ts` z VM i `ApiErrorUiModel` lub re-użyj istniejącego jeśli jest.
   - Zaimplementuj funkcje mapujące DTO → VM.
3. Klient API:
   - Utwórz `src/lib/api/sessions.client.ts` z funkcjami: `fetchSessionDetails`, `fetchSessionMessages`, `postSessionMessage`, `endSession` (styl jak `profile.client.ts`).
4. Hooki:
   - Dodaj `src/hooks/useSession.ts`, `src/hooks/useSessionMessages.ts`, `src/hooks/useSendMessage.ts`, `src/hooks/useEndSession.ts`, `src/hooks/useAutoScroll.ts` (proste, bez zewn. zależności).
5. Komponenty UI:
   - Utwórz folder `src/components/session/` i komponenty: `SessionScreen.tsx`, `SessionHeader.tsx`, `ReviewModeBar.tsx`, `MessageList.tsx`, `MessageItem.tsx`, `VisualizationPanel.tsx`, `InputArea.tsx`.
   - Wykorzystaj istniejące `src/components/ui/*` (Button, Card, Input, Switch, Alert, Skeleton itp.).
6. Logika `SessionScreen`:
   - Pobieranie danych po `sessionId`; render stanów: loading, error, success.
   - Integracja hooków, podpięcie akcji do propsów dzieci.
7. Walidacja i UX:
   - Zasady blokady kontrolek, licznik znaków, auto-scroll, focus input po starcie/po wysłaniu.
8. Obsługa błędów:
   - Wspólny helper do mapowania błędów API; lekkie toasty/alerty.
9. Testy ręczne scenariuszy:
   - 401/403/404, brak wiadomości, długie wiadomości, zakończona sesja, sieć offline.
10. Dostrojenie stylów:
   - Tailwind 4 + shadcn/ui, responsywność (mobile first), kontrast i aria-live dla odpowiedzi AI.
