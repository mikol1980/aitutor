<conversation_summary>
<decisions>
1.  Rezygnacja z systemu kodów dostępu na rzecz prostej rejestracji użytkowników w wersji beta.
2.  Tabela `users` (zmieniona na `profiles`) będzie przechowywać `login`, `email` (jako pole obowiązkowe) i `password_hash`, zintegrowane z systemem `auth.users` Supabase.
3.  "Graf Wiedzy" zostanie zaimplementowany jako prosta struktura z tabelami `sections` (działy), `topics` (zagadnienia) i tabelą złączkową `topic_dependencies` dla relacji wiele-do-wielu.
4.  Treści edukacyjne będą przechowywane w tabeli `learning_content` z użyciem typu `JSONB` dla elastyczności, z dodatkowymi polami `content_type` (ENUM) i `is_verified` (boolean).
5.  Testy diagnostyczne dla MVP będą miały stały, predefiniowany zestaw pytań.
6.  Postęp ucznia będzie śledzony na poziomie poszczególnych `topics` w tabeli `user_progress`.
7.  Sesje nauki będą przechowywane w tabeli `sessions`, zawierającej podsumowanie od AI (`ai_summary`), a pełne transkrypcje w powiązanej tabeli `session_messages`.
8.  Dane analityczne będą anonimizowane na etapie eksportu, a nie w głównej bazie danych.
9.  Zostaną wdrożone polityki bezpieczeństwa na poziomie wierszy (RLS), aby użytkownicy mieli dostęp wyłącznie do swoich danych.
10. Wygenerowane wizualizacje będą efemeryczne i nie będą przechowywane w bazie danych.
11. Wszystkie klucze główne będą typu `UUID` w celu zapewnienia bezpieczeństwa i skalowalności.
12. Relacja `profiles` do `auth.users` będzie używać `ON DELETE CASCADE` w celu zapewnienia spójności danych przy usuwaniu konta.
13. Zostanie zautomatyzowany proces tworzenia profilu użytkownika za pomocą funkcji i triggera w PostgreSQL.
14. Zostanie dodana kolumna `has_completed_tutorial` (boolean) w tabeli `profiles` do śledzenia ukończenia samouczka.
15. Do tabel `sections` i `topics` zostanie dodana kolumna `display_order` (integer) w celu zarządzania kolejnością wyświetlania.
</decisions>

<matched_recommendations>
1.  **Integracja z Supabase Auth**: Zdecydowano o wykorzystaniu wbudowanych mechanizmów Supabase do zarządzania użytkownikami, a nasza tabela `users` stała się tabelą `profiles` z relacją 1-do-1 do `auth.users`, co jest najlepszą praktyką.
2.  **Użycie typów ENUM**: Zaakceptowano rekomendację, aby zdefiniować formalne typy `ENUM` w PostgreSQL dla pól takich jak `status` czy `sender`, co zapewni integralność i wydajność danych.
3.  **Automatyzacja tworzenia profili**: Zgodzono się, że najlepszym rozwiązaniem jest stworzenie triggera, który automatycznie tworzy wiersz w `profiles` po dodaniu nowego użytkownika do `auth.users`.
4.  **Strategia indeksowania**: Przyjęto zalecenie dotyczące założenia indeksów na wszystkich kluczach obcych oraz stworzenia indeksów złożonych (np. `(user_id, topic_id)`) w celu optymalizacji najczęstszych zapytań.
5.  **Ujednolicenie treści**: Zaakceptowano pomysł ujednolicenia przechowywania wszystkich treści edukacyjnych, w tym pytań diagnostycznych, w jednej tabeli `learning_content` z polem `usage_type`.
6.  **Wykorzystanie widoków (VIEWS)**: Przyjęto rekomendację stworzenia widoków (`vw_user_skill_map`, `vw_session_details`), aby uprościć logikę zapytań po stronie aplikacji i zhermetyzować złożone operacje `JOIN` w bazie danych.
7.  **Zasady usuwania kaskadowego**: Zdecydowano o użyciu `ON DELETE CASCADE` dla klucza obcego w `profiles`, co jest najprostszym i najbezpieczniejszym rozwiązaniem dla MVP.
</matched_recommendations>

<database_planning_summary> 
Na podstawie wymagań produktu dla MVP aplikacji AI Tutor, przeprowadzono szczegółowe planowanie schematu bazy danych w PostgreSQL. Celem było stworzenie solidnej, skalowalnej i bezpiecznej struktury danych, która będzie wspierać kluczowe funkcjonalności aplikacji.

**a. Główne wymagania dotyczące schematu bazy danych**
Schemat musi obsługiwać:
-   **Zarządzanie użytkownikami**: Rejestrację, logowanie i przechowywanie podstawowych danych profilowych w integracji z Supabase Auth.
-   **Graf Wiedzy**: Modelowanie hierarchii i zależności między działami (`sections`) i zagadnieniami (`topics`) matematycznymi.
-   **Zarządzanie treścią**: Przechowywanie różnorodnych materiałów edukacyjnych (wyjaśnień, zadań, pytań) w elastyczny sposób.
-   **Testy diagnostyczne**: Definiowanie testów i przechowywanie wyników oraz odpowiedzi użytkowników.
-   **Śledzenie postępów**: Monitorowanie postępów użytkownika na poziomie poszczególnych zagadnień.
-   **Logowanie sesji**: Zapisywanie transkrypcji rozmów z AI oraz podsumowań generowanych przez AI.

**b. Kluczowe encje i ich relacje**
-   `profiles`: Tabela z danymi użytkowników, połączona relacją 1-do-1 z `auth.users`. Jest centralnym punktem dla wszystkich danych powiązanych z użytkownikiem.
-   `sections` i `topics`: Tworzą podstawę "Grafu Wiedzy". `sections` ma relację 1-do-wielu z `topics`.
-   `topic_dependencies`: Tabela złączkowa implementująca relację wiele-do-wielu między `topics`, co pozwala na definiowanie warunków wstępnych.
-   `learning_content`: Centralna tabela na wszystkie treści edukacyjne, wykorzystująca `JSONB` dla elastyczności. Powiązana z `topics`.
-   `sessions` i `session_messages`: Przechowują historię interakcji. `sessions` ma relację 1-do-wielu z `session_messages`.
-   `user_progress`: Tabela złączkowa łącząca `profiles` i `topics`, śledząca status i wynik nauki każdego tematu przez użytkownika.
-   `diagnostic_tests`, `diagnostic_test_attempts`, `user_answers`: Struktura do zarządzania testami, próbami podejścia i poszczególnymi odpowiedziami użytkownika.

**c. Ważne kwestie dotyczące bezpieczeństwa i skalowalności**
-   **Bezpieczeństwo**: Głównym mechanizmem zabezpieczającym jest wdrożenie polityk bezpieczeństwa na poziomie wierszy (RLS) dla wszystkich tabel zawierających dane użytkowników. Zapewnia to, że użytkownicy mogą uzyskać dostęp i modyfikować wyłącznie własne dane. Integracja z Supabase Auth odciąża aplikację od implementacji logiki uwierzytelniania.
-   **Skalowalność**: Zdecydowano o użyciu `UUID` jako kluczy głównych, co ułatwia rozproszenie systemu w przyszłości. Zaplanowano stworzenie odpowiednich indeksów na kluczach obcych i polach często używanych w zapytaniach. Kwestie takie jak partycjonowanie tabeli `session_messages` zostały uznane za przedwczesną optymalizację, ale architektura jest na to przygotowana.

**d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia**
Brak. Wszystkie kluczowe kwestie dotyczące schematu bazy danych dla MVP zostały omówione i rozwiązane. Finalny schemat jest gotowy do implementacji.
</database_planning_summary>

<unresolved_issues>
Na obecnym etapie planowania bazy danych dla wersji MVP nie zidentyfikowano żadnych nierozwiązanych kwestii. Wszystkie aspekty poruszone w dyskusji zostały uwzględnione w finalnym schemacie.
</unresolved_issues>
</conversation_summary>