## 1. Lista tabel z kolumnami, typami i ograniczeniami

### Typy ENUM
- **content_usage_type**: 'explanation' | 'exercise' | 'diagnostic_question'
- **user_progress_status**: 'not_started' | 'in_progress' | 'completed'
- **message_sender**: 'user' | 'ai'

### Tabela: profiles
- **id**: UUID, PK, REFERENCES `auth.users(id)` ON DELETE CASCADE, NOT NULL
- **login**: TEXT, UNIQUE, NOT NULL, CHECK `char_length(login) >= 3`
- **email**: TEXT, UNIQUE, NOT NULL
- **has_completed_tutorial**: BOOLEAN, NOT NULL, DEFAULT false
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: sections
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **title**: TEXT, NOT NULL
- **description**: TEXT, NULL
- **display_order**: INT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: topics
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **section_id**: UUID, NOT NULL, REFERENCES `sections(id)` ON DELETE CASCADE
- **title**: TEXT, NOT NULL
- **description**: TEXT, NULL
- **display_order**: INT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: topic_dependencies
- **topic_id**: UUID, NOT NULL, REFERENCES `topics(id)` ON DELETE CASCADE
- **dependency_id**: UUID, NOT NULL, REFERENCES `topics(id)` ON DELETE CASCADE
- PK: (topic_id, dependency_id)

### Tabela: learning_content
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **topic_id**: UUID, NULL, REFERENCES `topics(id)` ON DELETE CASCADE
- **usage_type**: content_usage_type, NOT NULL
- **content**: JSONB, NOT NULL
- **is_verified**: BOOLEAN, NOT NULL, DEFAULT false
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: diagnostic_tests
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **section_id**: UUID, UNIQUE, NOT NULL, REFERENCES `sections(id)` ON DELETE CASCADE
- **title**: TEXT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: diagnostic_test_learning_content
- **test_id**: UUID, NOT NULL, REFERENCES `diagnostic_tests(id)` ON DELETE CASCADE
- **content_id**: UUID, NOT NULL, REFERENCES `learning_content(id)` ON DELETE CASCADE
- PK: (test_id, content_id)

### Tabela: diagnostic_test_attempts
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **user_id**: UUID, NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE
- **diagnostic_test_id**: UUID, NOT NULL, REFERENCES `diagnostic_tests(id)` ON DELETE CASCADE
- **score**: FLOAT, NOT NULL, CHECK `score >= 0 AND score <= 1`
- **completed_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: user_answers
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **attempt_id**: UUID, NOT NULL, REFERENCES `diagnostic_test_attempts(id)` ON DELETE CASCADE
- **content_id**: UUID, NOT NULL, REFERENCES `learning_content(id)` ON DELETE CASCADE
- **answer_content**: JSONB, NOT NULL
- **is_correct**: BOOLEAN, NOT NULL

### Tabela: sessions
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **user_id**: UUID, NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE
- **topic_id**: UUID, NULL, REFERENCES `topics(id)`
- **started_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- **ended_at**: TIMESTAMPTZ, NULL
- **ai_summary**: TEXT, NULL

### Tabela: session_messages
- **id**: UUID, PK, DEFAULT gen_random_uuid(), NOT NULL
- **session_id**: UUID, NOT NULL, REFERENCES `sessions(id)` ON DELETE CASCADE
- **sender**: message_sender, NOT NULL
- **content**: JSONB, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()

### Tabela: user_progress
- **user_id**: UUID, NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE
- **topic_id**: UUID, NOT NULL, REFERENCES `topics(id)` ON DELETE CASCADE
- **status**: user_progress_status, NOT NULL, DEFAULT 'not_started'
- **score**: FLOAT, NULL, CHECK `score >= 0 AND score <= 1`
- **updated_at**: TIMESTAMPTZ, NOT NULL, DEFAULT now()
- PK: (user_id, topic_id)

### Widoki (informacyjne)
- **vw_user_skill_map**: uproszczony wgląd w mapę umiejętności użytkownika (JOIN `profiles`, `sections`, `topics`, `user_progress`), uporządkowany wg `display_order`.
- **vw_session_details**: szczegóły sesji wraz z informacjami o użytkowniku i temacie (JOIN `sessions`, `profiles`, `topics`).


## 2. Relacje między tabelami
- **profiles (1) — (1) auth.users**: `profiles.id` = `auth.users.id` (ON DELETE CASCADE)
- **sections (1) — (n) topics**: `topics.section_id` → `sections.id` (ON DELETE CASCADE)
- **topics (n) — (n) topic_dependencies (self-join)**: `topic_dependencies.topic_id` i `topic_dependencies.dependency_id` → `topics.id` (ON DELETE CASCADE)
- **topics (1) — (n) learning_content**: `learning_content.topic_id` → `topics.id` (ON DELETE CASCADE)
- **sections (1) — (1) diagnostic_tests**: `diagnostic_tests.section_id` UNIQUE → `sections.id` (ON DELETE CASCADE)
- **diagnostic_tests (n) — (n) learning_content**: przez `diagnostic_test_learning_content`
- **profiles (1) — (n) diagnostic_test_attempts**: `diagnostic_test_attempts.user_id` → `profiles.id` (ON DELETE CASCADE)
- **diagnostic_tests (1) — (n) diagnostic_test_attempts**: `diagnostic_test_attempts.diagnostic_test_id` → `diagnostic_tests.id` (ON DELETE CASCADE)
- **diagnostic_test_attempts (1) — (n) user_answers**: `user_answers.attempt_id` → `diagnostic_test_attempts.id` (ON DELETE CASCADE)
- **learning_content (1) — (n) user_answers**: `user_answers.content_id` → `learning_content.id` (ON DELETE CASCADE)
- **profiles (1) — (n) sessions**: `sessions.user_id` → `profiles.id` (ON DELETE CASCADE)
- **topics (1) — (n) sessions**: `sessions.topic_id` → `topics.id`
- **sessions (1) — (n) session_messages**: `session_messages.session_id` → `sessions.id` (ON DELETE CASCADE)
- **profiles (1) — (n) user_progress (by topic)**: `user_progress.user_id` → `profiles.id` (ON DELETE CASCADE)
- **topics (1) — (n) user_progress**: `user_progress.topic_id` → `topics.id` (ON DELETE CASCADE)


## 3. Indeksy
### Indeksy na kluczach obcych
- `topics(section_id)`
- `learning_content(topic_id)`
- `diagnostic_tests(section_id)`
- `diagnostic_test_learning_content(test_id)`
- `diagnostic_test_learning_content(content_id)`
- `diagnostic_test_attempts(user_id)`
- `diagnostic_test_attempts(diagnostic_test_id)`
- `user_answers(attempt_id)`
- `user_answers(content_id)`
- `sessions(user_id)`
- `sessions(topic_id)`
- `session_messages(session_id)`
- `user_progress(topic_id)`

### Indeksy złożone
- `user_progress(user_id, topic_id)`

### Inne
- `learning_content USING GIN (content)` — pełnotekstowe/kluczowe zapytania po JSONB


## 4. Zasady PostgreSQL (RLS)
- Włączone RLS na tabelach zawierających dane użytkownika:
  - `profiles`, `diagnostic_test_attempts`, `user_answers`, `sessions`, `session_messages`, `user_progress`

- Polityki dostępu:
  - Profiles: "Allow users to manage their own profile" — `USING (auth.uid() = id)`
  - Diagnostic test attempts: "Allow users to manage their own test attempts" — `USING (auth.uid() = user_id)`
  - User answers: "Allow users to manage their own answers" — `USING (EXISTS (SELECT 1 FROM diagnostic_test_attempts WHERE id = attempt_id AND user_id = auth.uid()))`
  - Sessions: "Allow users to manage their own sessions" — `USING (auth.uid() = user_id)`
  - Session messages: "Allow users to manage messages in their own sessions" — `USING (EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND user_id = auth.uid()))`
  - User progress: "Allow users to manage their own progress" — `USING (auth.uid() = user_id)`

- Tabele referencyjne/treściowe (np. `sections`, `topics`, `learning_content`, `diagnostic_tests`, `diagnostic_test_learning_content`) — RLS wyłączone (dostęp tylko przez serwer/app wg potrzeb); w razie wymogu ograniczeń można dodać polityki READ-ONLY.


## 5. Dodatkowe uwagi projektowe
- **Integracja z Supabase Auth**: `profiles.id` = `auth.users.id` z `ON DELETE CASCADE` zapewnia spójność przy usuwaniu kont.
- **Normalizacja (3NF)**: Struktura jest znormalizowana; denormalizacja nie jest potrzebna na etapie MVP.
- **Spójność treści testów**: Pytania diagnostyczne reużywają `learning_content` z `usage_type = 'diagnostic_question'`, mapowane przez tabelę łączącą.
- **Kolejność prezentacji**: Pola `display_order` w `sections` i `topics` umożliwiają kontrolę kolejności widoków/UI.
- **Wydajność**: Indeksy FK + GIN na JSONB istotnie przyspieszają zapytania. Przy dużych wolumenach wiadomości można rozważyć partycjonowanie `session_messages` w przyszłości.
- **Widoki**: `vw_user_skill_map` i `vw_session_details` upraszczają typowe zapytania po stronie aplikacji i hermetyzują JOINy.
- **Walidacja aplikacyjna**: Zalecane użycie Zod w warstwie aplikacji na payloady JSONB (`learning_content.content`, `session_messages.content`, `user_answers.answer_content`).
