# Product Requirements Document (PRD)
# AI Tutor Matematyki

**Wersja:** 1.0  
**Data:** 8 października 2025  
**Status:** Draft  
**Autor:** Product Team

---

## 1. Executive Summary

### 1.1 Wizja Produktu
AI Tutor Matematyki to inteligentna aplikacja edukacyjna, która zapewnia spersonalizowane wsparcie w nauce matematyki dla licealistów przygotowujących się do matury podstawowej. Produkt łączy konwersację głosową z AI, wizualizacje matematyczne i adaptacyjny system nauczania, tworząc dostępną i skuteczną alternatywę dla tradycyjnych korepetycji.

### 1.2 Problem
Licealiści przygotowujący się do matury podstawowej z matematyki napotykają następujące bariery:
- **Wysokie koszty korepetycji** (100-200 zł/h) przy ograniczonych budżetach rodzinnych
- **Brak elastyczności czasowej** tradycyjnych korepetycji
- **Luki w podstawach** (70% uczniów) wynikające z wcześniejszych klas
- **Strach przed oceną** i zadawaniem pytań w obecności innych
- **Brak indywidualnego tempa** w zajęciach grupowych

### 1.3 Rozwiązanie
Aplikacja webowa (PWA) oferująca:
- Dostęp 24/7 do AI tutora matematyki prowadzącego rozmowę głosową
- Automatyczną adaptację do poziomu i potrzeb ucznia
- Wizualizacje matematyczne (wykresy, wzory, diagramy) generowane w czasie rzeczywistym
- Cena konkurencyjna: 79-99 zł/miesiąc za nielimitowany dostęp

### 1.4 Kluczowe Metryki Sukcesu (MVP - 3 miesiące)
- 40%+ tygodniowa retencja użytkowników
- 25%+ conversion rate z darmowej sesji na płatną
- 4.0+ średnia ocena sesji (skala 1-5)
- 50+ płatnych użytkowników
- <5% zgłoszeń błędów AI na sesję

---

## 2. Strategia Produktu

### 2.1 Grupa Docelowa - MVP
**Primary Persona: Ania, uczennica II klasy liceum**
- Wiek: 17 lat
- Cel: Zdać maturę podstawową z matematyki (min. 30%)
- Pain points:
  - Luki w podstawach (potęgi, pierwiastki, procenty)
  - Wstyd pytać na lekcji o "proste rzeczy"
  - Rodzice nie mają budżetu na korepetycje (100-200 zł/h)
  - Chce się uczyć wieczorami i w weekendy
- Zachowania:
  - Używa smartphone do nauki (YouTube, aplikacje edukacyjne)
  - Preferuje samodzielną naukę w swoim tempie
  - Motywowana strachem przed oblaniem matury

### 2.2 Ekspansja (Post-MVP)
- **Faza 2 (6-9 miesięcy):** Egzamin ósmoklasisty (E8)
- **Faza 3 (9-12 miesięcy):** Matura rozszerzona
- **Faza 4 (rok 2):** Uczniowie z trudnościami, szczególnie uzdolnieni
- **Faza 5 (rok 2-3):** Inne przedmioty (fizyka, chemia)

### 2.3 Model Biznesowy

W MVP usługa całkowicie darmowa. Później subskrupcje.

#### Okres Próbny
- **Pierwsza sesja gratis:** 30-45 minut pełnej interakcji z AI
- **Test diagnostyczny:** Bezpłatnie, bez limitu czasu

#### Pricing
| Pakiet | Cena | Opis | Oszczędność |
|--------|------|------|-------------|
| Miesięczny | 79-99 zł | Nielimitowany dostęp | - |
| 3-miesięczny | 199-229 zł | Nielimitowany dostęp | ~20% |
| Pakiet godzinowy | 49 zł | 10 godzin | Dla użytkowników sporadycznych |

**Benchmark:** Tradycyjne korepetycje 40-80 zł/h → AI tutor 2-3x tańszy

#### Revenue Model
- Subskrypcje (primary)
- Pay-per-use dla użytkowników sporadycznych
- Partnerstwa B2B ze szkołami (post-MVP)

---

## 3. Wymagania Funkcjonalne - MVP

### 3.1 Core Features

#### F1: Rozmowa Głosowa z AI Tutorem
**Priority:** P0 (Must-have)

**Opis:**
Uczeń prowadzi konwersację głosową z AI tutorem matematyki, który wyjaśnia materiał, zadaje pytania i rozwiązuje zadania.

**Wymagania:**
- Tryb "push-to-talk" (przycisk do mówienia)
- STT (Speech-to-Text): OpenAI Whisper
- TTS (Text-to-Speech): ElevenLabs lub OpenAI TTS
- Backup: tryb tekstowy zawsze dostępny
- Maksymalna latencja: 3-5 sekund (STT + LLM + TTS)
- Obsługa języka polskiego z młodzieżowym slangiem

**Acceptance Criteria:**
- [ ] Użytkownik może rozpocząć rozmowę głosową jednym kliknięciem
- [ ] Audio jest nagrywane tylko gdy przycisk wciśnięty
- [ ] Transkrypcja pojawia się w interfejsie
- [ ] AI odpowiada głosowo i tekstowo
- [ ] Użytkownik może w każdej chwili przełączyć się na tryb tekstowy
- [ ] Błędy STT są obsługiwane gracefully ("Przepraszam, nie dosłyszałem. Możesz powtórzyć?")

**Out of Scope dla MVP:**
- Tryb ciągły z Voice Activity Detection (VAD)
- Rozpoznawanie emocji w głosie
- Multiple głosy AI do wyboru

---

#### F2: System Adaptacji do Poziomu Ucznia
**Priority:** P0 (Must-have)

**Opis:**
System automatycznie dostosowuje poziom trudności i tempo nauczania do możliwości ucznia.

**Komponenty:**

**F2.1: Test Diagnostyczny Wstępny (15-20 minut)**
- Po 2-3 pytania z każdego działu matematyki:
  - Algebra
  - Geometria
  - Funkcje
  - Trygonometria
  - Kombinatoryka
  - Prawdopodobieństwo
  - Statystyka
  - Podstawy (działania, potęgi, pierwiastki, procenty)
- Pytania otwarte (nie test wielokrotnego wyboru)
- AI ocenia odpowiedzi i identyfikuje luki

**F2.2: Profil Ucznia**
System przechowuje:
- Poziom kompetencji per dział (0-100%)
- Historia rozwiązanych zadań
- Tematy opanowane
- Tematy wymagające powtórki
- Typowe błędy ucznia
- Preferowane metody wyjaśniania

**F2.3: Adaptacja Real-time**
- AI dostosowuje trudność pytań na podstawie poprawności odpowiedzi
- Jeśli uczeń struggluje (3 błędy z rzędu) → AI wraca do podstaw
- Jeśli uczeń radzi sobie łatwo → AI zwiększa trudność
- AI identyfikuje luki i proponuje powrót do wcześniejszych tematów

**Acceptance Criteria:**
- [ ] Test diagnostyczny jest dostępny po onboardingu
- [ ] Test trwa 15-20 minut (nie dłużej!)
- [ ] AI przedstawia wyniki: "Twoje mocne strony: X, Y. Do poprawy: Z."
- [ ] Profil ucznia aktualizuje się po każdej sesji
- [ ] AI automatycznie proponuje trudniejsze/łatwiejsze zadania
- [ ] System pamięta kontekst między sesjami

---

#### F3: Wizualizacje Matematyczne
**Priority:** P0 (Must-have)

**Opis:**
AI automatycznie generuje wizualizacje matematyczne podczas wyjaśniania konceptów.

**Typy Wizualizacji:**
- Wykresy funkcji (liniowe, kwadratowe, wykładnicze, trygonometryczne)
- Wzory matematyczne (LaTeX rendering)
- Diagramy geometryczne (trójkąty, okręgi, wielokąty)
- Ilustracje krok po kroku rozwiązania

**Wymagania:**
- Wizualizacje generowane automatycznie gdy AI:
  1. Wyjaśnia nowe pojęcie wymagające ilustracji
  2. Rozwiązuje zadanie krok po kroku
  3. Użytkownik wprost o to prosi ("Narysuj wykres", "Pokaż to na rysunku")
- AI informuje głosowo przed wygenerowaniem: "Rysuję wykres funkcji kwadratowej..."
- Użytkownik może poprosić o modyfikację: "Pokaż inne współczynniki", "Powiększ fragment"
- Wizualizacje zapisują się w historii sesji

**Technologia:**
- **TBD:** Research wymagany - opcje:
  - Manim (powerful, heavy)
  - p5.js (interaktywne)
  - MathJax + Canvas (lightweight)
  - D3.js (wykresy)

**Acceptance Criteria:**
- [ ] Wzory matematyczne renderują się poprawnie (LaTeX)
- [ ] Wykresy podstawowych funkcji są czytelne
- [ ] Wizualizacje ładują się <2 sekundy
- [ ] Wizualizacje są responsywne (mobile + desktop)
- [ ] Użytkownik może przybliżać/oddalać wykresy

---

#### F4: Aktywne Prowadzenie przez Materiał
**Priority:** P0 (Must-have)

**Opis:**
AI pełni rolę aktywnego tutora, nie tylko odpowiada na pytania, ale proaktywnie prowadzi przez materiał.

**Zachowania AI:**
- Na początku sesji pyta o cel:
  - "Nowa lekcja" → AI proponuje kolejny temat z planu
  - "Powtórka" → AI wybiera temat wymagający utrwalenia
  - "Rozwiązujemy zadania" → AI daje zadania do rozwiązania
  - "Wyjaśnij mi coś" → AI czeka na pytanie ucznia
- AI zadaje pytania sprawdzające co 5-10 minut
- AI proponuje zadania do samodzielnego rozwiązania
- AI stosuje różne metody wyjaśniania:
  - Analogie
  - Przykłady z życia
  - Wizualizacje
  - Krok po kroku rozwiązanie
- AI delikatnie sugeruje powrót do planu jeśli uczeń rozpraszają się

**Przykładowa Interakcja:**
```
AI: Dzisiaj przećwiczymy funkcje kwadratowe. Pamiętasz, co to jest wierzchołek paraboli?
Uczeń: Nie jestem pewny...
AI: W porządku, przypomnę. Spójrz na ten wykres... [generuje wizualizację]
AI: Wierzchołek to najwyższy lub najniższy punkt paraboli. Widzisz tutaj? [wskazuje punkt]
AI: Teraz Ty - jaki jest wierzchołek funkcji y = x² + 2x + 1?
Uczeń: Hmm, (1, 0)?
AI: Niemal! Dobry kierunek myślenia. Policzmy razem...
```

**Acceptance Criteria:**
- [ ] AI na początku sesji pyta o cel (4 opcje)
- [ ] AI proaktywnie prowadzi konwersację (nie czeka biernie)
- [ ] AI zadaje pytania sprawdzające co 5-10 minut
- [ ] AI dostosowuje styl wyjaśniania do ucznia
- [ ] AI delikatnie interweniuje gdy uczeń zbytnio odchodzi od tematu

---

#### F5: Zakres Merytoryczny - Matura Podstawowa
**Priority:** P0 (Must-have)

**Opis:**
Pełny zakres materiału matury podstawowej według wymagań MEN + moduł uzupełniający podstawy.

**Działy Matury Podstawowej:**

1. **Algebra**
   - Liczby i działania
   - Wyrażenia algebraiczne
   - Równania i nierówności
   - Układy równań

2. **Geometria**
   - Planimetria (trójkąty, czworokąty, okręgi)
   - Stereometria podstawowa
   - Twierdzenie Pitagorasa
   - Pole, obwód, objętość

3. **Funkcje**
   - Funkcja liniowa
   - Funkcja kwadratowa
   - Wykładnicza i logarytmiczna (podstawy)
   - Własności funkcji

4. **Trygonometria**
   - Funkcje trygonometryczne w trójkącie prostokątnym
   - Okrąg jednostkowy (podstawy)

5. **Kombinatoryka i Prawdopodobieństwo**
   - Zliczanie
   - Permutacje, kombinacje (podstawy)
   - Prawdopodobieństwo klasyczne

6. **Statystyka**
   - Średnia, mediana, dominanta
   - Odchylenie standardowe
   - Interpretacja danych

**Moduł Uzupełniający Podstawy (dla 70% uczniów z lukami):**
- Działania na ułamkach
- Potęgi i pierwiastki
- Procenty i proporcje
- Przekształcanie wzorów

**Acceptance Criteria:**
- [ ] AI potrafi wyjaśnić każdy temat z powyższej listy
- [ ] AI zna typowe zadania maturalne z każdego działu
- [ ] AI identyfikuje luki w podstawach i proponuje uzupełnienie
- [ ] AI stosuje terminologię zgodną z podręcznikami MEN

---

### 3.2 Supporting Features

#### F6: Onboarding 3-stopniowy
**Priority:** P0 (Must-have)

**Krok 1: Rejestracja**
- Email + hasło
- Zgoda na regulamin i politykę prywatności
- Jeśli użytkownik <18 lat → zgoda rodzica przez email (jeśli wymagane RODO)

**Krok 2: Wideo wprowadzające (2 minuty)**
- Jak korzystać z AI tutora
- Jak działa rozmowa głosowa (push-to-talk)
- Czym jest test diagnostyczny
- Możliwość pominięcia (skip)

**Krok 3: Krótka rozmowa z AI (1-2 minuty)**
- AI wita: "Cześć! Jestem Twoim tutorem matematyki. Jak masz na imię?"
- AI pyta: "Co Cię najbardziej stresuje w matematyce?"
- AI oswaja z interfejsem: "Świetnie! Widzisz przycisk na dole? Wciśnij go gdy chcesz mówić."
- Cel: oswojenie z głosem AI i interfejsem

**Krok 4: Test diagnostyczny (15-20 minut)**
- Po 2-3 pytania z każdego działu
- AI informuje o postępie: "Super! 3 z 8 działów za nami."
- Po teście: "Oto Twoje wyniki..." [prezentacja mocnych/słabych stron]

**Krok 5: Pierwsza sesja (30-45 min gratis)**
- AI proponuje: "Widzę, że geometria wymaga powtórki. Zacznijmy od trójkątów?"
- Pełna sesja nauki

**Acceptance Criteria:**
- [ ] Onboarding jest liniowy i nieprzerywany
- [ ] Użytkownik może pominąć wideo
- [ ] Test diagnostyczny można przerwać i wrócić później
- [ ] Po onboardingu użytkownik wie jak korzystać z aplikacji
- [ ] Completion rate onboardingu >30%

---

#### F7: System Feedbacku i Obsługi Błędów
**Priority:** P0 (Must-have)

**F7.1: Zgłoszenie Problemu**
- Przycisk "Zgłoś problem" widoczny w każdej sesji
- Formularz: "Co było nie tak?" (textarea)
- Automatyczne dołączenie kontekstu (transkrypcja ostatnich 5 minut)
- Potwierdzenie: "Dzięki! Sprawdzimy to w ciągu 24h."

**F7.2: AI Przyznaje się do Niepewności**
- Gdy AI nie jest pewien: "Hmm, nie jestem pewien tej odpowiedzi. Spróbujmy inaczej..."
- Gdy AI popełnia błąd: "Oj, pomyliłem się. Prawidłowa odpowiedź to..."
- AI nigdy nie halucynuje z pełną pewnością

**F7.3: Kolejka Weryfikacji przez Eksperta**
- Zgłoszenia trafiają do eksperta matematyki
- SLA: odpowiedź w ciągu 24h
- Email do użytkownika: "Sprawdziliśmy Twoje zgłoszenie. Oto prawidłowe rozwiązanie..."
- FAQ aktualizuje się na podstawie zgłoszeń

**F7.4: Ankieta po Sesji**
- Po zakończeniu sesji:
  - "Jak oceniasz dzisiejszą lekcję?" [1-5 gwiazdek]
  - "Co moglibyśmy poprawić?" [opcjonalny komentarz]
- Użytkownik może pominąć

**Acceptance Criteria:**
- [ ] Przycisk "Zgłoś problem" zawsze widoczny
- [ ] Zgłoszenia trafiają do systemu kolejkowania
- [ ] AI przyznaje się do niepewności w odpowiednich momentach
- [ ] Ankieta pojawia się po każdej sesji >10 minut
- [ ] Zbieranie danych do analityki

---

#### F8: Analityka i Tracking
**Priority:** P0 (Must-have)

**Eventy do Trackowania:**
- Rejestracja użytkownika
- Rozpoczęcie/zakończenie onboardingu (+ completion rate)
- Rozpoczęcie/zakończenie testu diagnostycznego
- Rozpoczęcie/zakończenie sesji (+ długość)
- Użycie trybu głosowego vs tekstowego
- Wygenerowanie wizualizacji
- Zgłoszenie problemu
- Wypełnienie ankiety
- Konwersja na płatny plan
- Porzucenie sesji (<5 minut)

**Metryki do Dashboardu Admin:**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Retention rate (D1, D7, D30)
- Conversion rate (free → paid)
- Średnia długość sesji
- Średnia ocena sesji
- % zgłoszeń błędów
- Churn rate

**Technologia:**
- Mixpanel lub Amplitude
- Custom baza danych (Supabase)

**Acceptance Criteria:**
- [ ] Wszystkie kluczowe eventy są trackowane
- [ ] Admin może zobaczyć metryki w czasie rzeczywistym
- [ ] Analityka jest RODO compliant (anonimizacja)

---

### 3.3 Out of Scope dla MVP

**Post-MVP Features:**
- ❌ Dashboard ucznia z wizualizacją postępów
- ❌ Tryb głosowy ciągły z VAD
- ❌ Gamifikacja (punkty, osiągnięcia, streak)
- ❌ Funkcje społecznościowe (rankingi, grupy)
- ❌ Upload zdjęć rozwiązań (OCR)
- ❌ Multiple osobowości AI tutora
- ❌ Native apps iOS/Android
- ❌ Moduł dla rodziców (monitoring dziecka)
- ❌ Integracje z dziennikiem elektronicznym
- ❌ Materiały do pobrania (PDF, notatki)

---

## 4. User Stories i Ścieżki

### 4.1 Epic: Pierwszy Kontakt (Onboarding)

**US-001: Rejestracja Użytkownika**
```
Jako nowy użytkownik
Chcę zarejestrować się w aplikacji
Aby otrzymać dostęp do AI tutora

Acceptance Criteria:
- Mogę zarejestrować się przez email + hasło
- Jeśli mam <18 lat, rodzic otrzymuje email z prośbą o zgodę
- Po rejestracji widzę wideo wprowadzające
```

**US-002: Onboarding z AI**
```
Jako nowy użytkownik
Chcę poznać jak działa aplikacja
Aby skutecznie z niej korzystać

Acceptance Criteria:
- Oglądam 2-minutowe wideo (lub skip)
- Rozmawiam z AI przez 1-2 minuty
- Rozumiem jak działa push-to-talk
- Czuję się gotowy na test diagnostyczny
```

**US-003: Test Diagnostyczny**
```
Jako nowy użytkownik
Chcę przejść test diagnostyczny
Aby AI poznał mój poziom

Acceptance Criteria:
- Test trwa 15-20 minut
- Widzę postęp (3/8 działów)
- Mogę przerwać i wrócić później
- Po teście dostaję wyniki z mocnymi/słabymi stronami
```

---

### 4.2 Epic: Typowa Sesja Nauki

**US-004: Rozpoczęcie Sesji**
```
Jako użytkownik
Chcę rozpocząć sesję z AI tutorem
Aby uczyć się matematyki

Acceptance Criteria:
- Loguję się do aplikacji
- AI wita mnie po imieniu
- AI przypomina co robiłem ostatnio
- AI pyta o cel dzisiejszej sesji (4 opcje)
- Wybieram opcję i sesja się zaczyna
```

**US-005: Nauka z AI - Nowa Lekcja**
```
Jako użytkownik
Chcę nauczyć się nowego tematu
Aby poszerzyć swoją wiedzę

Acceptance Criteria:
- Wybieram "Nowa lekcja"
- AI proponuje temat na podstawie mojego planu
- AI wyjaśnia temat krok po kroku
- AI pokazuje wizualizacje
- AI zadaje pytania sprawdzające
- AI dostosowuje tempo do moich odpowiedzi
```

**US-006: Rozwiązywanie Zadań**
```
Jako użytkownik
Chcę przećwiczyć zadania
Aby utrwalić wiedzę

Acceptance Criteria:
- Wybieram "Rozwiązujemy zadania"
- AI daje mi zadanie do rozwiązania
- Opisuję rozwiązanie ustnie
- AI wizualizuje to co mówię
- AI daje feedback (poprawnie/błąd/częściowo)
- Jeśli błąd, AI pokazuje prawidłowe rozwiązanie
```

**US-007: Zakończenie Sesji**
```
Jako użytkownik
Chcę zakończyć sesję
Aby zobaczyć podsumowanie

Acceptance Criteria:
- Klikam "Zakończ sesję" lub AI proponuje przerwę po 30-60 min
- Widzę krótkie podsumowanie: "Dzisiaj omówiliśmy X, rozwiązałeś Y zadań"
- Wypełniam ankietę (ocena 1-5 + komentarz opcjonalny)
- Postęp zapisuje się automatycznie
```

---

### 4.3 Epic: Konwersja na Płatny Plan

**US-008: Koniec Darmowej Sesji**
```
Jako użytkownik po darmowej sesji
Chcę zobaczyć opcje płatne
Aby kontynuować naukę

Acceptance Criteria:
- Po 30-45 min AI informuje: "To była Twoja darmowa sesja"
- Widzę 3 pakiety (miesięczny, 3-miesięczny, godzinowy)
- Widzę porównanie z kosztami tradycyjnych korepetycji
- Mogę wybrać pakiet i przejść do płatności
```

**US-009: Płatność**
```
Jako użytkownik
Chcę wykupić subskrypcję
Aby kontynuować naukę

Acceptance Criteria:
- Wybieram pakiet
- Widzę stronę płatności (Stripe/PayU)
- Po opłaceniu dostaję potwierdzenie email
- Mogę kontynuować naukę natychmiast
```

---

### 4.4 Epic: Obsługa Problemów

**US-010: Zgłoszenie Błędu AI**
```
Jako użytkownik
Chcę zgłosić błąd AI
Aby otrzymać prawidłową odpowiedź

Acceptance Criteria:
- Klikam "Zgłoś problem"
- Opisuję co było nie tak
- Otrzymuję potwierdzenie: "Sprawdzimy w 24h"
- W ciągu 24h dostaję email z wyjaśnieniem
```

---

## 5. Wymagania Techniczne

### 5.1 Stack Technologiczny

#### Frontend
- **Framework:** React / Next.js
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Component Library:** Shadcn/ui
- **PWA:** Service Workers dla offline capability
- **Math Rendering:** MathJax lub KaTeX
- **Visualizations:** **TBD** (Manim / p5.js / D3.js / Canvas)

#### Backend
- **Platform:** Supabase
  - PostgreSQL (baza danych)
  - Auth (autentykacja)
  - Realtime (synchronizacja)
  - Edge Functions (API endpoints)
- **Language:** TypeScript / Python dla ML/AI logic

#### AI & Voice
- **LLM:** GPT-4, Claude 3.5 Sonnet, lub Bielik (**TBD** - benchmark wymagany)
- **STT (Speech-to-Text):** OpenAI Whisper API
- **TTS (Text-to-Speech):** ElevenLabs lub OpenAI TTS
- **Prompt Engineering:** Custom system prompts dla matematyki

#### Infrastructure
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **CDN:** Cloudflare
- **Analytics:** Mixpanel lub Amplitude
- **Monitoring:** Sentry (error tracking)
- **Payment:** Stripe lub PayU (Polski provider)

#### DevOps
- **CI/CD:** GitHub Actions
- **Version Control:** Git + GitHub
- **Environment Management:** .env files + Vercel env vars

### 5.2 Architektura Systemu

```
┌─────────────────┐
│   PWA (React)   │
│   - UI/UX       │
│   - Voice UI    │
│   - Visualizer  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase API   │
│  - Auth         │
│  - PostgreSQL   │
│  - Realtime     │
│  - Edge Funcs   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  External APIs              │
│  - OpenAI/Claude (LLM)      │
│  - Whisper (STT)            │
│  - ElevenLabs (TTS)         │
└─────────────────────────────┘
```

### 5.3 Data Model (Supabase PostgreSQL)

#### Table: users
```sql
- id (uuid, PK)
- email (text, unique)
- name (text)
- age (int)
- parent_consent (boolean) -- dla <18 lat
- created_at (timestamp)
- subscription_status (enum: free, paid, expired)
- subscription_expires_at (timestamp)
```

#### Table: student_profiles
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- diagnostic_test_completed (boolean)
- competency_levels (jsonb) -- {algebra: 70, geometry: 50, ...}
- weak_topics (text[]) -- ["trójkąty", "potęgi"]
- learning_path (text) -- "matura_podstawowa"
- created_at (timestamp)
- updated_at (timestamp)
```

#### Table: sessions
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- started_at (timestamp)
- ended_at (timestamp)
- duration_seconds (int)
- goal (enum: new_lesson, review, practice, question)
- topics_covered (text[])
- ai_model_used (text) -- "gpt-4", "claude-3.5"
- voice_mode_used (boolean)
- visualizations_generated (int)
```

#### Table: session_messages
```sql
- id (uuid, PK)
- session_id (uuid, FK → sessions)
- timestamp (timestamp)
- role (enum: user, ai)
- content_text (text)
- content_audio_url (text) -- S3/Supabase Storage
- visualization_data (jsonb) -- parametry wykresu
```

#### Table: feedback
```sql
- id (uuid, PK)
- session_id (uuid, FK → sessions)
- rating (int) -- 1-5
- comment (text)
- created_at (timestamp)
```

#### Table: error_reports
```sql
- id (uuid, PK)
- session_id (uuid, FK → sessions)
- user_id (uuid, FK → users)
- description (text)
- context_messages (jsonb) -- ostatnie 5 minut
- status (enum: pending, in_review, resolved)
- expert_response (text)
- created_at (timestamp)
- resolved_at (timestamp)
```

### 5.4 AI Prompt Engineering

**System Prompt Template:**
```
Jesteś cierpliwym i zachęcającym tutorem matematyki dla polskich licealistów przygotowujących się do matury podstawowej.

ZASADY:
1. Zawsze mów po polsku, używając terminologii zgodnej z programem MEN
2. Dostosowuj poziom trudności do ucznia (profil: {student_profile})
3. Jeśli uczeń się struggluje, wróć do podstaw i wyjaśnij prościej
4. Używaj analogii i przykładów z życia codziennego
5. Generuj wizualizacje gdy to pomaga zrozumieniu (oznacz: [VISUALIZATION: ...])
6. Zadawaj pytania sprawdzające co 5-10 minut
7. Jeśli nie jesteś pewien odpowiedzi, przyznaj się: "Nie jestem pewien, sprawdźmy to razem..."
8. Motywuj i chwal postępy: "Świetnie! Właśnie opanowałeś nowy temat!"

KONTEKST OBECNEJ SESJI:
- Cel: {session_goal}
- Ostatnie tematy: {recent_topics}
- Słabe punkty ucznia: {weak_topics}

Rozpocznij sesję pytając o cel dzisiejszej nauki.
```

### 5.5 Bezpieczeństwo i Compliance

#### RODO Compliance
- [ ] Szyfrowanie danych osobowych (at rest + in transit)
- [ ] Minimalizacja danych - zbieramy tylko to co niezbędne
- [ ] Prawo do usunięcia danych ("usuń moje konto")
- [ ] Prawo do eksportu danych (JSON/PDF)
- [ ] Anonimizacja danych do analizy
- [ ] Przechowywanie audio maksymalnie 30 dni (do weryfikacji)
- [ ] Transparentna polityka prywatności
- [ ] Zgoda na cookies i tracking

#### Zgoda Rodzica (dla <18 lat)
- [ ] Weryfikacja wieku przy rejestracji
- [ ] Email do rodzica/opiekuna z linkiem do wyrażenia zgody
- [ ] Blokada pełnego dostępu do momentu zgody
- [ ] **TBD:** Konsultacja z prawnikiem - czy wymagane w Polsce?

#### Rate Limiting
- [ ] Max 100 requestów/minutę per użytkownik
- [ ] Max 10 sesji dziennie dla free tier
- [ ] Protection przed abuse API

#### Content Moderation
- [ ] Filtrowanie wulgaryzmów i nieodpowiednich treści
- [ ] Monitoring nieprawidłowych interakcji
- [ ] System reportowania abuse

---

## 6. Metryki Sukcesu

### 6.1 Metryki MVP (3 miesiące)

#### Engagement
| Metryka | Target | Pomiar |
|---------|--------|--------|
| Tygodniowa retencja | **40%+** | % użytkowników wracających po 7 dniach |
| Sesje/tydzień | **3+** | Średnia liczba sesji na użytkownika |
| Długość sesji | **30+ min** | Średni czas trwania sesji |
| Completion rate onboardingu | **30%+** | % użytkowników kończących test diagnostyczny |

#### Konwersja
| Metryka | Target | Pomiar |
|---------|--------|--------|
| Free → Paid conversion | **25%+** | % użytkowników wykupujących subskrypcję |
| Płatni użytkownicy | **50+** | Liczba aktywnych subskrypcji |

#### Satysfakcja
| Metryka | Target | Pomiar |
|---------|--------|--------|
| Średnia ocena sesji | **4.0+** | Skala 1-5 z ankiety |
| NPS (Net Promoter Score) | **50+** | Ankieta co 5 sesji |

#### Jakość
| Metryka | Target | Pomiar |
|---------|--------|--------|
| Zgłoszenia błędów AI | **<5%** | % sesji ze zgłoszeniem |
| Bounce rate pierwsza sesja | **<10%** | % sesji <5 minut |

### 6.2 Metryki Rok 1 (12 miesięcy)

#### Wzrost
- **MAU (Monthly Active Users):** 1000+
- **Płatni użytkownicy:** 300+ (30% conversion)
- **Partnerstwa ze szkołami:** 10-20
- **Miesięczny churn:** <15%

#### Finansowe
- **MRR (Monthly Recurring Revenue):** 25,000+ zł
- **Break-even:** Osiągnięty lub bliski
- **Unit economics:**
  - LTV (Lifetime Value): 500+ zł
  - CAC (Customer Acquisition Cost): <150 zł
  - LTV/CAC ratio: >3

#### Produkt
- **3 ścieżki:** E8, matura podstawowa, matura rozszerzona
- **Native apps:** iOS + Android
- **Dashboard:** Implementowany
- **Funkcja głosowa ciągła:** Implementowana

---

## 7. Timeline i Roadmap

### 7.1 Faza 0: Research & Planning (2 tygodnie)
**Tydzień 1:**
- [ ] Benchmark modeli LLM (GPT-4, Claude, Bielik) - 20-30 zadań maturalnych
- [ ] Research bibliotek wizualizacji - prototyp 2-3 opcji
- [ ] Legal review - RODO, zgoda rodziców, liability
- [ ] Finalizacja wyboru stacku

**Tydzień 2:**
- [ ] User testing - mechanika ustnego rozwiązywania zadań (5-10 uczniów)
- [ ] Przygotowanie datasetu matematycznego (zadania, wyjaśnienia)
- [ ] Setup infrastruktury (Supabase, Vercel, GitHub)
- [ ] Design system (Figma) - key screens

### 7.2 Faza 1: MVP Development (4 tygodnie)
**Sprint 1 (tydzień 1-2):**
- [ ] Setup projektu (Next.js + Supabase + TypeScript)
- [ ] Autentykacja (email/password)
- [ ] Onboarding flow (UI)
- [ ] Integracja OpenAI Whisper (STT)
- [ ] Integracja TTS (ElevenLabs/OpenAI)
- [ ] Podstawowy chat interface

**Sprint 2 (tydzień 3-4):**
- [ ] Test diagnostyczny (logika + UI)
- [ ] Profil ucznia (data model + logika)
- [ ] Integracja LLM z custom prompts
- [ ] System adaptacji real-time
- [ ] Wizualizacje matematyczne (MVP - wykresy + LaTeX)
- [ ] Zapisywanie sesji

**Sprint 3 (tydzień 5-6):**
- [ ] Aktywne prowadzenie przez AI (prompt engineering)
- [ ] System feedbacku (ankiety, zgłoszenia błędów)
- [ ] Analityka (tracking eventów)
- [ ] Landing page + pricing page
- [ ] Płatności (Stripe/PayU integration)

**Sprint 4 (tydzień 7-8):**
- [ ] Testing + bug fixing
- [ ] Performance optimization
- [ ] RODO compliance implementation
- [ ] Content moderation
- [ ] Internal testing z zespołem
- [ ] Przygotowanie do beta launch

### 7.3 Faza 2: Beta Testing (4 tygodnie)
**Cel:** 20-50 użytkowników testowych

**Tydzień 1-2:**
- [ ] Rekrutacja testerów (bezpośredni kontakt z maturzystami)
- [ ] Onboarding pierwszych 20 użytkowników
- [ ] Daily monitoring metryk
- [ ] Zbieranie feedbacku (interviews, ankiety)
- [ ] Bug fixing na bieżąco

**Tydzień 3-4:**
- [ ] Analiza danych z testów
- [ ] Iteracje na podstawie feedbacku
- [ ] Optymalizacja promptów AI
- [ ] Poprawa UX pain points
- [ ] Przygotowanie do soft launch

### 7.4 Faza 3: Iteracje + Funkcja Głosowa (8 tygodni)
**Sprint 5-6 (tydzień 1-4):**
- [ ] Implementacja feedbacku z beta testów
- [ ] Funkcja głosowa ciągła z VAD
- [ ] Ulepszenie wizualizacji
- [ ] Dashboard ucznia (V1)
- [ ] Moduł eksperta (weryfikacja zgłoszeń)

**Sprint 7-8 (tydzień 5-8):**
- [ ] Rozbudowa contentu matematycznego
- [ ] Optymalizacja kosztów API
- [ ] Advanced analytics
- [ ] A/B testing (pricing, onboarding)
- [ ] Przygotowanie materiałów marketingowych

### 7.5 Faza 4: Soft Launch (4 tygodnie)
**Tydzień 1:**
- [ ] Soft launch dla 100-200 użytkowników
- [ ] Marketing organiczny (social media, grupy FB)
- [ ] Monitoring metryk 24/7
- [ ] Support team ready

**Tydzień 2-4:**
- [ ] Skalowanie infrastruktury
- [ ] Optymalizacja conversion funnel
- [ ] Partnership outreach do szkół
- [ ] Zbieranie testimoniali

### 7.6 Rok 1: Roadmap Post-MVP

**Q1 (miesiące 4-6):**
- Rozszerzenie na E8
- Native app iOS (MVP)
- Gamifikacja (V1)
- Materiały do pobrania

**Q2 (miesiące 7-9):**
- Matura rozszerzona
- Native app Android
- Moduł dla rodziców
- Multiple osobowości AI

**Q3 (miesiące 10-12):**
- Tryby specjalne (trudności, uzdolnieni)
- Upload zdjęć zadań (OCR)
- Integracja z dziennikiem
- Funkcje społecznościowe

**Q4 (rok 2):**
- Ekspansja na fizyk ę i chemię
- B2B partnerships ze szkołami (skalowanie)
- Advanced analytics dla nauczycieli
- API dla integracji zewnętrznych

---

## 8. Ryzyka i Mitygacje

### 8.1 Ryzyka Techniczne

#### R1: Jakość odpowiedzi AI (halucynacje matematyczne)
**Impact:** High | **Probability:** Medium

**Mitigacja:**
- Benchmark 3 modeli LLM przed wyborem
- Custom system prompts z przykładami (few-shot learning)
- Mechanizm self-verification ("sprawdź swoją odpowiedź")
- Przycisk "Zgłoś problem" + weryfikacja przez eksperta
- Baza FAQ z verified answers
- Regular audits odpowiedzi AI (sample 100 sesji/tydzień)

#### R2: Koszty API AI przekraczają przychody
**Impact:** High | **Probability:** Medium

**Mitigacja:**
- Wybranie modelu z dobrym balance cost/quality (może Bielik)
- Semantic cache dla popularnych pytań (Redis + embeddings)
- Rate limiting dla free tier
- Optymalizacja długości promptów
- Monitoring kosztu per użytkownik
- Dynamiczne pricing jeśli koszty rosną

#### R3: Latencja głosowa >5 sekund (frustrujące UX)
**Impact:** Medium | **Probability:** Medium

**Mitigacja:**
- Streaming TTS (odtwarzanie audio przed pełnym wygenerowaniem)
- Preloading popularnych odpowiedzi audio
- Fallback do tekstu jeśli audio się nie wczyta
- Wybór szybszego modelu TTS dla MVP
- Feedback visual ("AI myśli...") podczas latencji

#### R4: Biblioteka wizualizacji zbyt skomplikowana/wolna
**Impact:** Medium | **Probability:** Low

**Mitigacja:**
- Research + prototyp w Fazie 0
- Wybranie lightweight solution dla MVP (MathJax + Canvas)
- Lazy loading wizualizacji
- Server-side rendering wykresów (jeśli szybsze)
- Fallback do statycznych obrazów jeśli generowanie fails

### 8.2 Ryzyka Produktowe

#### R5: Użytkownicy preferują tekst nad głos
**Impact:** High | **Probability:** Medium

**Mitigacja:**
- A/B testing w MVP (analiza % użycia głosu vs tekstu)
- Zawsze dostępny tryb tekstowy jako backup
- Pitch value proposition głosu ("bardziej naturalne, hands-free")
- Możliwość hybrydowa (uczeń pisze, AI mówi lub vice versa)
- Pivot do "tekst first" jeśli dane pokazują preferencję

#### R6: Conversion <10% (zamiast 25% target)
**Impact:** High | **Probability:** Medium

**Mitigacja:**
- Extended free trial (2-3 sesje zamiast 1)
- A/B testing pricing (może 59 zł/msc lepiej konwertuje niż 99 zł)
- Testimoniale i social proof na pricing page
- Email nurture campaign po darmowej sesji
- Exit intent popup z ofertą (-20% przez 24h)
- Clear value prop: "2-3x taniej niż korepetycje"

#### R7: Churn >20% miesięcznie
**Impact:** High | **Probability:** Medium

**Mitigacja:**
- Email z przypomnieniem po 3 dniach nieaktywności
- Feature: "Streak" (dni z rzędu korzystania) dla motywacji
- Dashboard pokazujący postęp ("Jesteś 60% bliżej celu!")
- Exit survey: "Dlaczego rezygnujesz?" → learn & improve
- Win-back campaigns dla churned users
- Quality improvements na podstawie feedbacku

#### R8: Sezonowość (niska sprzedaż w wakacje)
**Impact:** Medium | **Probability:** High

**Mitigacja:**
- Pricing: pakiety 3-miesięczne zachęcają do zakupu przed wakacjami
- Summer content: "Powtórka wakacyjna", "Przygotowanie do nowego roku"
- Discount campaigns w lipcu-sierpniu
- Ekspansja na E8 (egzamin w maju) i rozszerzoną (równomierna dystrybucja)
- B2B ze szkołami (stabilny revenue)

### 8.3 Ryzyka Biznesowe

#### R9: Konkurencja (duzi gracze typu Photomath, Brainly)
**Impact:** High | **Probability:** High

**Mitigacja:**
- **USP:** Rozmowa głosowa + aktywne prowadzenie (nie tylko answering)
- Focus na polski rynek i program MEN (localization)
- Lepsze ceny niż korepetycje (strong value prop)
- Community building (social media, influencerzy edukacyjni)
- Szybkie iteracje na podstawie feedbacku (startup agility)

#### R10: Trudność w rekrutacji pierwszych 20-50 testerów
**Impact:** Medium | **Probability:** Medium

**Mitigacja:**
- Multi-channel approach:
  - Bezpośredni kontakt z licealistami (online communities)
  - Grupy Facebook dla maturzystów i rodziców
  - TikTok/Instagram Reels z demo (viral potential)
  - Outreach do 5-10 nauczycieli matematyki (offer free access dla klasy)
  - Incentives: darmowy dostęp na 3 miesiące dla early adopters
  - Referral program: "Zaproś znajomego, dostaniesz +7 dni"

#### R11: Partnership ze szkołami trudny do uzyskania (biurokracja)
**Impact:** Low | **Probability:** High

**Mitigacja:**
- Start od małych szkół prywatnych (mniej biurokracji)
- Offer pilot program: 1 klasa gratis przez 3 miesiące
- Case study z pierwszej szkoły → leverage dla kolejnych
- Target: nauczyciele matematyki (bottom-up), nie dyrektorzy (top-down)
- Odłożenie B2B na Q2/Q3 - focus na B2C w MVP

### 8.4 Ryzyka Prawne i Compliance

#### R12: RODO violation (kara UOD)
**Impact:** Very High | **Probability:** Low

**Mitigacja:**
- Legal review przed launch
- Implementation wszystkich wymagań RODO (see 5.5)
- Regular audits danych osobowych
- Privacy by design
- DPO (Data Protection Officer) jeśli wymagane
- Insurance dla startupów tech

#### R13: Liability - uczeń nie zda matury przez błąd AI
**Impact:** Medium | **Probability:** Low

**Mitigacja:**
- Wyraźne disclaimery w ToS: "AI to pomoc, nie zastępuje nauczyciela"
- Podczas onboardingu: "To narzędzie wspierające, nie gwarantujemy wyniku egzaminu"
- Mechanizm weryfikacji przez eksperta (24h)
- Regularne audity jakości odpowiedzi
- Insurance coverage

---

## 9. Nierozwiązane Kwestie (TBD)

### 9.1 Techniczne - Wymagają Decyzji w Fazie 0

**TBD-1: Biblioteka do wizualizacji matematycznych**
- **Opcje:** Manim, p5.js, MathJax+Canvas, D3.js
- **Deadline:** Tydzień 1 Fazy 0
- **Owner:** Lead Frontend Developer
- **Action:** Prototyp 2-3 opcji, porównanie performance + DX

**TBD-2: Wybór modelu LLM**
- **Opcje:** GPT-4, Claude 3.5 Sonnet, Bielik
- **Kryteria:** Accuracy (matematyka PL), koszt, latencja
- **Deadline:** Tydzień 1 Fazy 0
- **Owner:** AI/ML Engineer
- **Action:** Benchmark 20-30 zadań maturalnych na każdym modelu

**TBD-3: Mechanika ustnego rozwiązywania zadań**
- **Pytanie:** Jak dokładnie użytkownik rozwiązuje zadania głosowo? Czy AI prowadzi krok po kroku?
- **Deadline:** Tydzień 2 Fazy 0
- **Owner:** Product Manager + UX Designer
- **Action:** User testing z 5-10 uczniami, porównanie wariantów

**TBD-4: Strategia cache'owania API**
- **Pytanie:** Jak optymalizować koszty API bez utraty jakości?
- **Deadline:** Sprint 2
- **Owner:** Backend Lead
- **Action:** Implementacja semantic cache (Redis + embeddings)

### 9.2 Produktowe - Wymagają Walidacji w MVP

**TBD-5: Preferencja głos vs tekst**
- **Założenie:** Użytkownicy preferują głos
- **Walidacja:** A/B testing w MVP, analiza % użycia
- **Deadline:** Koniec Fazy 2 (beta testing)
- **Owner:** Product Manager
- **Decision criteria:** Jeśli <30% użycia głosu → pivot na "tekst first"

**TBD-6: Optymalna długość sesji**
- **Założenie:** 30-60 min
- **Walidacja:** Analityka długości sesji, identyfikacja naturalnych exit points
- **Deadline:** Koniec Fazy 2
- **Owner:** Data Analyst

**TBD-7: Target conversion rate**
- **Założenie:** 25%
- **Walidacja:** Tracking w MVP, A/B testing pricing
- **Deadline:** Koniec Fazy 3
- **Owner:** Growth Lead
- **Decision criteria:** Adjust pricing/onboarding based on actual data

**TBD-8: Timing dashboardu ucznia**
- **Pytanie:** Kiedy dodać dashboard? Czy brak go w MVP nie obniży retention?
- **Walidacja:** Feedback z beta testerów
- **Deadline:** Sprint 5 decision point
- **Owner:** Product Manager

### 9.3 Biznesowe - Wymagają Legal/Market Research

**TBD-9: Zgoda rodzica - exact requirements**
- **Pytanie:** Jakie dokładnie przepisy wymagają zgody rodzica dla <18 lat w Polsce?
- **Deadline:** Tydzień 1 Fazy 0
- **Owner:** Legal Counsel
- **Action:** Konsultacja z prawnikiem specjalizującym się w RODO + edtech

**TBD-10: Liability insurance**
- **Pytanie:** Czy potrzebne? Jaki zakres? Jaki koszt?
- **Deadline:** Przed launch
- **Owner:** CEO/Co-founder
- **Action:** Research insurance for edtech startups

**TBD-11: Strategia rekrutacji testerów - szczegóły**
- **Plan:** "Bezpośredni kontakt z maturzystami"
- **Pytanie:** Konkretnie jak? Gdzie? Jaka oferta?
- **Deadline:** Tydzień 2 Fazy 0
- **Owner:** Marketing/Growth Lead
- **Action:** Detailed acquisition plan (channels, messaging, incentives)

**TBD-12: B2B partnerships - model współpracy**
- **Pytanie:** Jaki pricing dla szkół? Jaki value prop dla dyrektorów?
- **Deadline:** Q2 (nie blokuje MVP)
- **Owner:** Sales/BD Lead
- **Action:** Discovery calls z 3-5 szkołami

---

## 10. Success Criteria - Definition of Done

### MVP jest gotowy gdy:

**Funkcjonalności:**
- [ ] Użytkownik może zarejestrować się i zalogować
- [ ] Onboarding 3-stopniowy działa (wideo → rozmowa z AI → test diagnostyczny)
- [ ] Test diagnostyczny identyfikuje poziom ucznia (8 działów)
- [ ] Rozmowa głosowa działa (push-to-talk, STT + TTS)
- [ ] Tryb tekstowy działa jako backup
- [ ] AI aktywnie prowadzi przez materiał (nie tylko odpowiada)
- [ ] Wizualizacje matematyczne generują się automatycznie
- [ ] System adaptacji dostosowuje trudność do ucznia
- [ ] Profil ucznia zapisuje historię i postępy
- [ ] Ankieta po sesji zbiera feedback
- [ ] Przycisk "Zgłoś problem" działa, zgłoszenia trafiają do kolejki
- [ ] Pricing page prezentuje 3 pakiety
- [ ] Płatności przez Stripe/PayU działają
- [ ] Conversion z free do paid działa (użytkownik może kontynuować po opłaceniu)

**Jakość:**
- [ ] Wszystkie user stories z Epic 1-3 zaimplementowane
- [ ] Zero critical bugs
- [ ] Performance: wizualizacje ładują się <2s, latencja głosowa <5s
- [ ] Mobile-responsive (PWA działa na telefonie)
- [ ] RODO compliant (polityka prywatności, zgody, encryption)
- [ ] Analytics trackuje wszystkie kluczowe eventy
- [ ] Error monitoring (Sentry) skonfigurowany

**Content:**
- [ ] Pełny zakres matury podstawowej (materiały + zadania)
- [ ] Moduł uzupełniający podstawy
- [ ] AI prompts przetestowane na 50+ typowych scenariuszach
- [ ] FAQ z 20+ najczęstszymi pytaniami

**Team Readiness:**
- [ ] Team przeszkolony z produktu
- [ ] Support process zdefiniowany (SLA 24h dla zgłoszeń błędów)
- [ ] Monitoring dashboard dla metryk (DAU, sessions, conversion)
- [ ] Incident response plan gotowy

**Legal:**
- [ ] Terms of Service i Privacy Policy zaaprobowane przez prawnika
- [ ] RODO compliance zweryfikowany
- [ ] Disclaimers liability w aplikacji

---

## 11. Appendix

### 11.1 Zakres Matury Podstawowej (MEN 2025)

**Źródło:** Centralna Komisja Egzaminacyjna - wymagania egzaminacyjne 2025

**Działy:**
1. Liczby rzeczywiste (działania, potęgi, pierwiastki, logarytmy)
2. Wyrażenia algebraiczne (przekształcanie, wzory skrócone)
3. Równania i nierówności (liniowe, kwadratowe, układy)
4. Funkcje (liniowa, kwadratowa, wykładnicza, logarytmiczna, trygonometryczne)
5. Ciągi (arytmetyczne, geometryczne)
6. Planimetria (trójkąty, czworokąty, okręgi, pola, obwody)
7. Geometria analityczna (prosta, odległości, równanie okręgu)
8. Trygonometria (funkcje tryg, tożsamości, równania)
9. Stereometria (bryły, objętości, pola powierzchni)
10. Kombinatoryka i prawdopodobieństwo
11. Statystyka opisowa

**Punktacja:** 50 punktów (30% zdaje egzamin)

### 11.2 Słownik Terminów

| Termin | Definicja |
|--------|-----------|
| **PWA** | Progressive Web App - aplikacja webowa działająca jak natywna |
| **STT** | Speech-to-Text - zamiana mowy na tekst |
| **TTS** | Text-to-Speech - synteza mowy z tekstu |
| **LLM** | Large Language Model - model AI do generowania tekstu |
| **VAD** | Voice Activity Detection - detekcja mowy w audio |
| **LaTeX** | System składu tekstu dla wzorów matematycznych |
| **MEN** | Ministerstwo Edukacji Narodowej |
| **CKE** | Centralna Komisja Egzaminacyjna |
| **E8** | Egzamin ósmoklasisty |
| **RODO** | Ogólne Rozporządzenie o Ochronie Danych |
| **NPS** | Net Promoter Score - wskaźnik lojalności klientów |
| **MRR** | Monthly Recurring Revenue - miesięczne przychody cykliczne |
| **LTV** | Lifetime Value - wartość klienta w całym cyklu życia |
| **CAC** | Customer Acquisition Cost - koszt pozyskania klienta |
| **Churn** | % użytkowników rezygnujących z usługi |

### 11.3 Referencje i Inspiracje

**Konkurencja / Benchmarki:**
- **Photomath:** OCR zadań + rozwiązania krok po kroku (brak rozmowy)
- **Khan Academy:** Video lessons + practice (brak personalizacji real-time)
- **Brainly:** Q&A community (brak AI tutora)
- **ChatGPT w edukacji:** Generyczne, nie dostosowane do polskiego programu
- **Chegg:** Paid tutoring w USA (benchmark pricing)

**Technologie:**
- **OpenAI Whisper:** https://openai.com/research/whisper
- **ElevenLabs:** https://elevenlabs.io
- **Supabase:** https://supabase.com
- **MathJax:** https://www.mathjax.org
- **Manim:** https://www.manim.community

**Regulatory:**
- **RODO:** https://uodo.gov.pl
- **Wymagania maturalne MEN:** https://cke.gov.pl

---

## 12. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Tech Lead | | | |
| CEO/Founder | | | |

---

**Koniec dokumentu PRD v1.0**

*Ostatnia aktualizacja: 8 października 2025*

