# Podsumowanie Konwersacji: Planowanie Architektury UI dla AI Tutor MVP

## Decyzje Podjęte przez Użytkownika

1. **Interfejs konwersacyjny** będzie stale widoczny w dolnej części ekranu podczas sesji nauki, nie zakrywając wizualizacji
2. **Hierarchia nawigacji** będzie trzypoziomowa: Dashboard → Sekcja (Topics) → Sesja nauki
3. **Przepływ "cofania się"** będzie obsługiwany przez modalny dialog z wizualnym wskaźnikiem trybu powtórki (żółty pasek)
4. **Obszar wizualizacji** będzie dynamiczny z płynną animacją, możliwością minimalizacji do ikony
5. **Widok "Moje postępy"** będzie dwupoziomowy: przegląd sekcji + szczegóły z grafem Topics
6. **Stany ładowania AI** będą wielopoziomowe: natychmiastowe, opóźnione (>2s), długie (>5s) z możliwością anulowania
7. **Zarządzanie auth** będzie hybrydowe: Astro middleware (SSR) + React Context (client-side)
8. **Wzory matematyczne** będą wprowadzane przez pole tekstowe (LaTeX/notacja prosta) i głosowo (interpretacja AI)
9. **Strategia buforowania** będzie selektywna: localStorage dla struktury wiedzy, sessionStorage dla testów, brak cache dla session messages
10. **Test diagnostyczny** będzie wieloetapowy z progress barem, jedno pytanie na ekran, bez możliwości pominięcia
11. **Struktura komponentów React** będzie oparta o wzorzec Container/Presentational z modułową hierarchią
12. **Komunikacja real-time** będzie używać REST + Server-Sent Events (SSE) z fallbackiem do pollingu
13. **Zarządzanie stanami ładowania** będzie centralizowane przez React Query (TanStack Query)
14. **Tutorial onboarding** będzie interaktywny z rzeczywistą funkcjonalnością, 4 kroki, możliwość skip po kroku 2
15. **Responsywność** będzie mobile-first z conditional rendering dla różnych breakpointów
16. **Obsługa błędów** będzie wielopoziomowa z optimistic UI, retry logic i offline queue
17. **Zależności tematów** będą prezentowane jako lista z ikonami statusu + opcjonalny widok grafu
18. **Zarządzanie formularzami** będzie przez React Hook Form + Zod z autosave w sessionStorage
19. **Obsługa audio** będzie używać progressive enhancement z fallbackami dla nieobsługiwanych przeglądarek
20. **System feedbacku** będzie zintegrowany z floating button, kategoryzowanym feedbackiem i contextual prompts
21. **Dostępność** będzie na poziomie WCAG 2.1 AA z MathML, ARIA labels i keyboard navigation
22. **Struktura folderów** będzie feature-based z wyraźnym podziałem Astro/React
23. **System motywów** będzie używać CSS custom properties + Tailwind dark mode z zapisem preferencji w backend
24. **Optymalizacja performance** będzie multi-layer: bundle splitting, lazy loading, virtual scrolling, debouncing
25. **System animacji** będzie unified z Framer Motion dla złożonych + Tailwind dla prostych animacji
26. **System typów TypeScript** będzie centralized z Supabase auto-generated types + Zod schemas
27. **Strategia testowania** będzie pyramid: 30% unit, 50% integration, 20% E2E z Vitest + Playwright
28. **Persistence state** będzie multi-layer: localStorage (persistent), sessionStorage (tab-scoped), IndexedDB (large data)
29. **Wizualizacje matematyczne** będą hybrydowe: SVG (D3.js) dla prostych, Canvas (Plotly) dla złożonych
30. **Analytics** będzie privacy-first z self-hosted solution (Plausible/Matomo) i explicit consent

## Dopasowane Rekomendacje

### 1. Architektura Layoutu i Nawigacji

- **Persistent conversation interface** w dolnej części ekranu z dedykowanym obszarem centralnym dla wizualizacji
- **Three-tier navigation hierarchy**: Dashboard (Sections + Postępy + Profil) → Section Detail (Topics + Diagnostic Test) → Active Learning Session
- **Sidebar navigation** (desktop) / **Hamburger menu** (mobile)
- **Review mode visual indicator** (żółty pasek) dla sesji powtórkowych z kontekstem

### 2. Integracja z API i Zarządzanie Stanem

- **Hybrydowy model auth**: Astro middleware weryfikuje JWT przy SSR, React Context dla client-side, refresh token w httpOnly cookies
- **React Query** jako główne narzędzie do data fetching z priorytetami (Critical/High/Low) i optimistic updates
- **Multi-layer persistence**: localStorage (structure), sessionStorage (test state), IndexedDB (offline queue)
- **REST + SSE hybrid**: POST messages przez REST, receive AI responses przez Server-Sent Events z polling fallback
- **Session recovery**: Automatyczne wykrywanie aktywnej sesji przy page load z modal do kontynuacji

### 3. Komponenty i Struktura Kodu

**React Component Hierarchy**:
```
SessionContainer (smart)
├── SessionHeader (topic, timer, end button)
├── ConversationArea
│   ├── MessageList (auto-scroll)
│   │   └── MessageItem (text/math/audio types)
│   └── VisualizationPanel (dynamic, Portal for fullscreen)
├── InputArea
│   ├── TextInput (LaTeX support)
│   ├── VoiceButton (recording animation)
│   └── MathToolbar (symbol shortcuts)
└── ReviewModeBar (conditional)
```

**Folder Structure**:
```
src/
├── components/
│   ├── ui/ (Shadcn base)
│   ├── react/ (feature-based: session/, progress/, test/, shared/)
│   └── astro/ (static components)
├── lib/
│   ├── services/ (API clients)
│   ├── hooks/ (custom React hooks)
│   ├── contexts/ (Auth, Session)
│   └── utils/
├── pages/
│   ├── api/ (endpoints)
│   └── app/ (routes)
└── types/ (DTOs, entities, UI types)
```

### 4. Przepływy Użytkownika

**Onboarding Flow**:
1. Welcome screen z 30s video
2. Guided first conversation (pre-scripted response)
3. Math formula input demo
4. Progress map z mock data
5. Skip możliwy po kroku 2, persistence w backend

**Diagnostic Test Flow**:
1. Intro screen (cel testu, no skip)
2. One question per screen + progress bar
3. Loading screen "Analizuję odpowiedzi..."
4. Results z interpretacją AI + "Rozpocznij naukę"
5. API sequence: POST attempt → POST answers → PUT complete

**Learning Session Flow**:
1. Topic selection (dependency check)
2. Session creation (POST /api/sessions)
3. Active conversation (SSE streaming)
4. AI identifies gap → Review mode modal
5. Complete review → Return to original context
6. End session (PUT /api/sessions/{id}/end)

**Progress Tracking**:
- Overview: Cards per Section z progress bars
- Detail: Expandable Topics z status colors (gray/blue/green)
- API: GET /api/user-progress + /api/sections/{id}/progress

### 5. Responsywność i Dostępność

**Responsive Breakpoints**:
- **Mobile (<768px)**: Vertical stack, accordion visualizations, voice-primary
- **Tablet (768-1024px)**: Split screen 60/40, floating visualization
- **Desktop (>1024px)**: Three-column layout (sidebar + content + viz)
- **Ultra-wide (>1920px)**: Optional quick reference panel

**WCAG 2.1 AA Compliance**:
- Keyboard navigation dla wszystkich interakcji
- ARIA labels i live regions
- MathML rendering dla wzorów
- AI-generated alt descriptions dla wykresów
- Contrast 4.5:1 (text), 3:1 (UI)
- Color-blind friendly palette z ikonami
- Screen reader testing (NVDA/JAWS)

### 6. Wizualizacje Matematyczne

**Technology Selection**:
- **SVG (D3.js)**: Proste 2D plots, funkcje, osie
- **Canvas (Plotly/Chart.js)**: >1000 punktów, animacje
- **WebGL (Three.js)**: 3D geometry (future)

**Features**:
- Lazy rendering (tylko gdy visible)
- Memoization (cache by equation hash)
- Interactive zoom/pan z throttling
- ARIA descriptions + data table alternative
- Export: PNG, LaTeX code, CSV

### 7. Obsługa Wzorów Matematycznych

**Input Methods**:
- Text field: LaTeX lub prosta notacja (x^2, sqrt(x))
- Voice: AI konwertuje dyktowane wzory na notację
- Real-time rendering (KaTeX/MathJax)
- Copy button dla LaTeX format

**Display**:
- Visual highlight w transkrypcji (jasne tło)
- Inline rendering jako matematyczne symbole
- Responsive scaling

### 8. Stany Ładowania i Error Handling

**Loading States**:
- Natychmiastowe: "AI myśli..." animation
- >2s: "Przygotowuję szczegółową odpowiedź..."
- >5s: Możliwość anulowania
- Voice: Waveform animation
- Visualizations: Skeleton loader

**Error Handling**:
- Network detection z visual indicator
- Optimistic UI z rollback
- Auto-retry (exponential backoff, max 3)
- Offline queue (IndexedDB sync)
- Graceful degradation (cached content)
- Contextual error messages

### 9. Performance i Optymalizacja

**Bundle Optimization**:
- Code splitting per route (Astro automatic)
- React.lazy() dla modals, visualization panel
- Target: <200KB initial, <50KB lazy chunks

**Runtime Optimization**:
- React.memo dla expensive components
- useMemo/useCallback dla computations
- Virtual scrolling (react-window) dla długich transkrypcji
- Debounce: 300ms (text), 500ms (LaTeX)

**Network**:
- Service Worker cache-first dla static assets
- Prefetch on hover (Astro)
- Web Vitals targets: LCP <2.5s, FID <100ms, CLS <0.1

### 10. Theming i Design System

**Color Tokens (CSS Variables)**:
```css
--background: hsl(0 0% 100%);
--primary: hsl(221.2 83.2% 53.3%);
--math-highlight: hsl(47 96% 89%);
--visualization-bg: hsl(210 40% 98%);
```

**Dark Mode**:
- Auto-detect system preference
- Manual toggle (saved to backend)
- Adapted charts (inverted axes)
- Cream bg dla wzorów (eye strain reduction)
- High contrast mode option

**Animation System**:
- Framer Motion dla complex animations
- Tailwind dla simple transitions
- Timing: 150ms (micro), 300ms (page), 200ms (modal)
- Reduced motion support (prefers-reduced-motion)

### 11. Type Safety i Walidacja

**TypeScript Organization**:
```typescript
// types/entities.ts - Database entities (Supabase generated)
// types/dtos.ts - API responses
// types/ui.ts - UI-specific types
```

**Validation**:
- Zod schemas dla forms + runtime validation
- Type inference: `type ProfileInput = z.infer<typeof schema>`
- Discriminated unions dla message types

**Form Management**:
- React Hook Form + Zod
- Field-level i global errors
- Autosave w sessionStorage
- Accessibility (ARIA, keyboard nav)

### 12. Audio Processing

**Voice Input**:
- Web Speech API detection z fallback
- Permission handling z wyjaśnieniem
- Waveform animation (canvas)
- Auto-stop po 10s ciszy

**Voice Output**:
- HTML5 audio z custom controls
- Playback speed: 1x, 1.25x, 1.5x
- Transcript sync (auto-scroll)
- iOS Safari autoplay handling

### 13. Testing Strategy

**Pyramid Approach**:
- **30% Unit tests**: Utils, hooks, pure components (Vitest)
- **50% Integration tests**: User flows, API mocking (MSW + Testing Library)
- **20% E2E tests**: Critical paths (Playwright)
- **Accessibility tests**: axe-core automated + manual checklist
- **Coverage targets**: >80% utils, >60% components

### 14. Analytics i Feedback

**Privacy-First Analytics**:
- Self-hosted (Plausible/Matomo)
- Anonymous metrics: page views, feature usage, performance
- Pseudonymous (consent required): user journey, completion rates
- No personal data, IP anonymization, 90-day retention

**Feedback System**:
- Floating button (bottom right)
- Categorized: Bug/Feature/Comment
- Screenshot attachment (html2canvas)
- Contextual prompts po teście/sesji
- NPS tracking po tygodniu

### 15. Buforowanie i Offline Support

**Cache Strategy**:
- **localStorage**: Sections/Topics (24h TTL), theme, preferences
- **sessionStorage**: Diagnostic test state, drafts, scroll positions
- **IndexedDB**: Offline message queue, cached visualizations
- **No cache**: Session messages (always fresh)

**Offline Strategy**:
- Queue messages w IndexedDB
- Sync on reconnect
- Show cached learning content
- Network status indicator

## Szczegółowe Podsumowanie Planowania Architektury UI

### Główne Założenia Architektoniczne

Aplikacja AI Tutor MVP zostanie zbudowana jako **progressive web application** z wykorzystaniem architektury hybrydowej **Astro (SSR) + React (client-side interactivity)**. Kluczowe decyzje architektoniczne koncentrują się wokół trzech filarów:

1. **Seamless Conversational Experience**: Interfejs konwersacyjny jako centrum doświadczenia użytkownika
2. **Adaptive Learning Support**: Elastyczna obsługa przepływów adaptacyjnych (diagnostic tests, review sessions)
3. **Educational Excellence**: Precyzyjne renderowanie matematycznych notacji i wizualizacji

### Kluczowe Widoki i Ekrany

#### 1. **Authentication & Onboarding** (Astro SSR)
- Landing page z formularzem logowania
- Registration z beta access code
- Interactive 4-step tutorial (React component)
- Persistence: `has_completed_tutorial` flag w profilu

#### 2. **Dashboard** (Astro + React hydration)
- Grid/List Sections z progress indicators
- Quick actions: "Kontynuuj ostatnią sesję", "Moje postępy"
- Recommended next topic (algorithm-based)
- SSR dla initial load, React dla interactivity

#### 3. **Section Detail View** (Astro + React)
- Lista Topics z dependency indicators (🔒⚠️✓)
- "Rozpocznij test diagnostyczny" CTA
- Optional: Network graph view (react-flow)
- Data: GET /api/sections/{id}/topics + /api/topics/{id}/dependencies

#### 4. **Diagnostic Test Flow** (React SPA)
- Intro screen
- Question screens (one per view)
- Loading/analysis screen
- Results with AI interpretation
- State management: React Query + sessionStorage backup

#### 5. **Learning Session View** (React SPA - główny widok)
**Layout Components**:
- **SessionHeader**: Topic title, timer, end button
- **ConversationArea**: 
  - Message list (user/AI, scrollable)
  - Dynamic visualization panel (collapsible)
- **InputArea**: Text field + voice button + math toolbar
- **ReviewModeBar**: Conditional overlay dla trybu powtórki

**Real-time Features**:
- SSE streaming AI responses
- Optimistic message updates
- Auto-scroll transkrypcji
- Progressive visualization rendering

#### 6. **Progress View** (Astro + React)
- **Overview**: Section cards z progress bars
- **Detail**: Expandable topic lists z scores
- **Summary**: Total progress dla całego programu
- Data: GET /api/user-progress + /api/sections/{id}/progress

#### 7. **Profile/Settings** (Astro + React)
- Theme toggle (light/dark/high-contrast)
- Audio preferences (playback speed)
- Tutorial access
- Feedback history

### Strategie Integracji z API

#### Authentication Flow
```
1. User login → Supabase Auth
2. JWT token → httpOnly cookie (refresh) + memory (access)
3. Astro middleware validates token per request
4. React AuthContext synchronizes client state
5. Auto-refresh before expiration (interceptor)
```

#### Data Fetching Strategy
```typescript
// Critical data (blocking)
const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn: profileService.getCurrent,
  suspense: true,
});

// High priority (skeleton loaders)
const { data: sections, isLoading } = useQuery({
  queryKey: ['sections'],
  queryFn: sectionsService.getAll,
  staleTime: 1000 * 60 * 60, // 1h cache
});

// Low priority (lazy)
const { data: progress } = useQuery({
  queryKey: ['progress'],
  queryFn: progressService.getOverview,
  enabled: isVisible,
});
```

#### Mutation Strategy
```typescript
// Optimistic updates
const mutation = useMutation({
  mutationFn: answersService.submit,
  onMutate: async (newAnswer) => {
    await queryClient.cancelQueries(['attempt', attemptId]);
    const previous = queryClient.getQueryData(['attempt', attemptId]);
    queryClient.setQueryData(['attempt', attemptId], (old) => ({
      ...old,
      answers: [...old.answers, { ...newAnswer, pending: true }],
    }));
    return { previous };
  },
  onError: (err, newAnswer, context) => {
    queryClient.setQueryData(['attempt', attemptId], context.previous);
  },
});
```

### Zarządzanie Stanem Aplikacji

#### State Layers
1. **Server State**: React Query (API data, cache, sync)
2. **Auth State**: React Context (`AuthProvider`)
3. **Session State**: React Context (`SessionProvider`) dla aktywnej sesji nauki
4. **UI State**: Local component state (forms, modals, animations)
5. **Persistent State**: localStorage/sessionStorage/IndexedDB

#### Context Providers Structure
```tsx
<AuthProvider> {/* Supabase session */}
  <QueryClientProvider> {/* React Query */}
    <ThemeProvider> {/* Light/Dark mode */}
      <App />
    </ThemeProvider>
  </QueryClientProvider>
</AuthProvider>
```

### Responsywność i Adaptive Design

#### Breakpoint Strategy
- Tailwind custom breakpoints: xs (375px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Custom hooks: `useBreakpoint()`, `useViewportHeight()`, `useMediaQuery()`
- Conditional rendering dla drastycznych różnic layoutu
- CSS Grid/Flexbox dla fluid layouts

#### Mobile-Specific Optimizations
- Touch targets min 44x44px
- Reduced animation complexity
- Voice-primary input strategy
- Bottom navigation dla thumb reachability
- Safe area insets dla notched devices

### Bezpieczeństwo na Poziomie UI

#### XSS Prevention
- Sanitization user input (DOMPurify)
- React automatic escaping
- CSP headers (Astro middleware)

#### CSRF Protection
- Supabase JWT verification
- SameSite cookies
- Origin validation

#### Data Privacy
- No sensitive data w localStorage
- Encryption offline queue (Web Crypto API)
- Clear data on logout
- Session timeout (15min inactivity)

### Quality Assurance i Monitoring

#### Testing Coverage
- Unit: Utility functions, custom hooks
- Integration: Complete user flows
- E2E: Critical paths (onboarding, first session, test completion)
- Accessibility: axe-core + manual WCAG audit
- Performance: Lighthouse CI (score >90)

#### Production Monitoring
- Error tracking: Sentry (optional dla MVP)
- Analytics: Plausible (privacy-first)
- Performance: Web Vitals (custom endpoint)
- User feedback: Built-in system

## Nierozwiązane Kwestie i Następne Kroki

### Kwestie Wymagające Dalszego Wyjaśnienia

1. **AI Integration Specifics**
   - Konkretny model AI i provider (OpenAI, Anthropic, custom?)
   - Format prompt engineering dla educational context
   - Rate limiting strategy dla AI API calls
   - Cost management i fallback scenarios

2. **Content Management**
   - Proces tworzenia i weryfikacji treści edukacyjnych
   - CMS/admin panel dla nauczycieli (poza MVP?)
   - Wersjonowanie contentu i A/B testing materiałów

3. **Audio Processing Backend**
   - Speech-to-text provider (Whisper, Google Cloud, Azure?)
   - Text-to-speech provider dla odpowiedzi AI
   - Audio storage strategy (Supabase Storage, CDN?)
   - Supported languages (tylko polski dla MVP?)

4. **Visualization Generation**
   - Gdzie generowane są wykresy? (Frontend vs Backend vs AI?)
   - Format przekazywania danych wykresu (JSON, SVG string?)
   - Storage dla generated visualizations

5. **Deployment i Infrastructure**
   - Hosting platform (Vercel, Netlify, custom VPS?)
   - CDN strategy dla static assets
   - Database backup i disaster recovery
   - Scaling strategy dla beta (15-20 users → more)

6. **Legal i Compliance**
   - GDPR compliance checklist
   - Terms of Service i Privacy Policy content
   - Parental consent dla użytkowników <18 lat?
   - Data retention policies

### Rekomendowane Następne Kroki

1. **Faza Projektowania (Week 1)**
   - Wireframes dla wszystkich 7 kluczowych widoków
   - High-fidelity mockups dla Learning Session View
   - Design system documentation (colors, typography, spacing)
   - Component library planning (Shadcn extensions)

2. **Faza Prototypowania (Week 2)**
   - Interactive Figma prototype dla main flow
   - Usability testing z 3-5 użytkownikami docelowymi
   - Iteration na podstawie feedbacku

3. **Faza Implementacji - Sprint 1 (Week 3-4)**
   - Setup projektu (Astro + React + Supabase)
   - Auth flow implementation
   - Basic layout components
   - Profile API integration

4. **Sprint 2 (Week 5-6)**
   - Dashboard i Section views
   - Progress tracking UI
   - Navigation system
   - Sections/Topics API integration

5. **Sprint 3 (Week 7-8)**
   - Diagnostic test flow (complete)
   - Form validation i error handling
   - Test attempts API integration

6. **Sprint 4 (Week 9-10)**
   - Learning Session View (core functionality)
   - Conversation interface
   - Basic AI integration (mock responses dla testów)
   - Session API integration

7. **Sprint 5 (Week 11-12)**
   - Math formula rendering
   - Visualization panel
   - Audio input/output (basic)

8. **Sprint 6 (Week 13-14)**
   - Review mode implementation
   - Topic dependencies visualization
   - Performance optimization

9. **Sprint 7 (Week 15-16)**
   - Onboarding tutorial
   - Feedback system
   - Analytics integration

10. **Sprint 8 (Week 17-18)**
    - Testing i bug fixing
    - Accessibility audit
    - Documentation
    - Beta deployment preparation

### Metryki Sukcesu dla UI Implementation

**Technical Metrics**:
- Lighthouse score >90 (Performance, Accessibility, Best Practices)
- First Contentful Paint <1.5s
- Time to Interactive <3s
- Bundle size <200KB initial
- Zero critical accessibility violations

**User Experience Metrics**:
- Tutorial completion rate >80%
- Session start success rate >95%
- Average session duration >15min
- Error rate <1% of interactions
- Mobile usability score >90

**Quality Metrics**:
- Test coverage >70%
- Zero critical bugs in production
- Mean time to resolution <24h dla reported issues
- User satisfaction score >4/5