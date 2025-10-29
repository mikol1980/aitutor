# **Dokument wymagań produktu (PRD) \- aitutor**

## **1\. Przegląd produktu**

AI Tutor to inteligentna, adaptacyjna platforma edukacyjna zaprojektowana, aby zapewnić spersonalizowane korepetycje z matematyki. Celem produktu jest dostarczenie uczniom wsparcia na miarę ich indywidualnych potrzeb, niezależnie od ich obecnego poziomu zaawansowania. Aplikacja wykorzystuje konwersacyjne AI, które potrafi prowadzić dialog głosowy i tekstowy, dynamicznie generować wizualizacje (wzory, wykresy) oraz dostosowywać ścieżkę nauki w czasie rzeczywistym w oparciu o postępy i zidentyfikowane braki w wiedzy ucznia.

Wersja MVP (Minimum Viable Product) skupi się na jednym, kluczowym celu: przygotowaniu uczniów do matury podstawowej z matematyki. Będzie to zamknięta, darmowa wersja beta dla wyselekcjonowanej grupy 15-20 uczniów, co pozwoli na zebranie kluczowych danych i opinii przed publicznym wdrożeniem modelu subskrypcyjnego.

## **2\. Problem użytkownika**

Uczniowie przygotowujący się do egzaminów z matematyki napotykają na szereg problemów, których tradycyjne metody nauki często nie rozwiązują:

1. *Brak indywidualizacji:* Standardowe lekcje i materiały edukacyjne operują na jednym, uśrednionym poziomie, nie uwzględniając faktu, że jedni uczniowie potrzebują więcej czasu na zrozumienie podstaw, podczas gdy inni są gotowi na bardziej zaawansowane zagadnienia.  
2. *Niezidentyfikowane braki w wiedzy:* Trudności z bieżącym materiałem często wynikają z zaległości na wcześniejszych etapach edukacji. Uczniom trudno jest samodzielnie zdiagnozować i uzupełnić te braki.  
3. *Ograniczona dostępność pomocy:* Dostęp do nauczyciela lub korepetytora jest ograniczony czasowo i finansowo. Uczniowie często potrzebują natychmiastowej odpowiedzi na pytanie, które pojawia się podczas samodzielnej nauki w domu.  
4. *Strach przed oceną:* Wielu uczniów krępuje się zadawać "proste" pytania w grupie z obawy przed oceną ze strony nauczyciela lub rówieśników.

AI Tutor ma za zadanie rozwiązać te problemy, oferując cierpliwego, zawsze dostępnego i w pełni spersonalizowanego mentora, który dostosowuje się do tempa ucznia, identyfikuje i pomaga nadrobić zaległości oraz tworzy bezpieczne środowisko do nauki bez presji.

## **3\. Wymagania funkcjonalne**

### **3.1. System Adaptacyjnej Nauki**

* *Testy Diagnostyczne:* Przed rozpoczęciem każdego działu tematycznego, system przeprowadza krótki test (3-5 pytań) w celu oceny początkowego poziomu wiedzy ucznia i dostosowania materiału.  
* *Graf Wiedzy:* Logika systemu oparta jest na grafie zależności pomiędzy poszczególnymi zagadnieniami matematycznymi. Pozwala to na inteligentne nawigowanie po materiale i precyzyjne identyfikowanie braków w wiedzy fundamentalnej.  
* *Mechanizm Powtórek ("Cofanie się"):* Jeśli AI zidentyfikuje, że błąd ucznia wynika z braku wiedzy z wcześniejszego tematu (np. błąd w zadaniu z funkcji kwadratowej spowodowany nieznajomością ułamków), system proaktywnie zaproponuje krótką, dedykowaną sesję powtórkową. Po jej ukończeniu uczeń płynnie wraca do pierwotnego tematu.

### **3.2. Interfejs Konwersacyjny**

* *Interakcja Głosowa:* Użytkownik może prowadzić naturalną rozmowę głosową z AI. System musi posiadać wysokiej jakości mechanizmy rozpoznawania mowy i syntezy głosu.  
* *Interakcja Tekstowa:* Równolegle dostępny jest czat tekstowy, który służy jako alternatywa oraz jako główne narzędzie do wprowadzania złożonych wzorów matematycznych, które są trudne do podyktowania.  
* *Generowanie Wizualizacji:* AI musi być zdolne do dynamicznego renderowania wzorów, wykresów funkcji i innych elementów graficznych. Może to robić na bezpośrednią prośbę użytkownika ("pokaż mi wykres tej funkcji") lub proaktywnie, gdy uzna to za pomocne w procesie tłumaczenia.

### **3.3. Zarządzanie Treścią i Osobowość AI**

* *Baza Wiedzy:* Zakres merytoryczny MVP obejmuje pełen materiał wymagany na maturze podstawowej z matematyki, zgodny z wytycznymi Centralnej Komisji Egzaminacyjnej (CKE).  
* *Proces Weryfikacji Treści:* Zastosowany zostanie model "AI-assisted creation". AI generuje propozycje zadań i wyjaśnień, ale każda treść jest ostatecznie weryfikowana i zatwierdzana przez doświadczonego nauczyciela matematyki.  
* *Osobowość Tutora:* AI ma zdefiniowaną osobowość: jest cierpliwym, wspierającym i zachęcającym mentorem. Jego celem jest budowanie pewności siebie u ucznia, a nie tylko przekazywanie wiedzy.

### **3.4. Śledzenie Postępów i Administracja**

* *Dostęp do Bety:* System musi pozwalać na zarządzanie dostępem dla ograniczonej grupy testerów (np. poprzez system zaproszeń lub kodów dostępu).  
* *Mapa Umiejętności:* Użytkownik ma dostęp do prostego panelu wizualizującego jego postępy – ukończone działy i opanowane zagadnienia.  
* *Wewnętrzne Logi Analityczne:* Aplikacja będzie zapisywać zanonimizowane transkrypcje sesji w celach analitycznych, co posłuży do identyfikacji błędów merytorycznych AI, problemów technicznych i optymalizacji algorytmów nauczania.  
* *Polityka Prywatności:* Wdrożona zostanie prosta, zrozumiała polityka prywatności informująca użytkowników o zbieranych danych i celu ich przetwarzania.

## **4\. Granice produktu**

### **W zakresie MVP:**

* Grupa docelowa: Uczniowie przygotowujący się do matury podstawowej z matematyki.  
* Zakres materiału: Pełen zakres tematyczny wymagany na maturze podstawowej.  
* Funkcjonalności: Interakcja głosowa i tekstowa, generowanie wizualizacji, testy diagnostyczne, mechanizm powtórek oparty na grafie wiedzy.  
* Dystrybucja: Zamknięta, darmowa beta dla 15-20 uczniów.

### **Poza zakresem MVP:**

* Inne egzaminy (matura rozszerzona, egzamin ósmoklasisty).  
* Inne przedmioty (fizyka, chemia, etc.).  
* Model subskrypcyjny i systemy płatności.  
* Zaawansowane mechanizmy grywalizacji (punkty, odznaki, rankingi).  
* Funkcje społecznościowe (np. wspólna nauka, porównywanie wyników).  
* Aplikacje mobilne (MVP będzie aplikacją webową).  
* Integracje z zewnętrznymi platformami edukacyjnymi.

## **5\. Historyjki użytkowników**

### **5.1. Onboarding i Dostęp**

* ID: US-001  
* Tytuł: Rejestracja i pierwszy dostęp do bety  
* Opis: Jako uczeń zaproszony do testów beta, chcę użyć unikalnego kodu dostępu, aby założyć konto i uzyskać dostęp do aplikacji.  
* Kryteria akceptacji:  
  1. System prezentuje stronę logowania z polem na kod dostępu.  
  2. Po wpisaniu prawidłowego kodu, mogę założyć konto (login, hasło).  
  3. Po wpisaniu nieprawidłowego kodu, widzę stosowny komunikat błędu.  
  4. Po pomyślnej rejestracji jestem zalogowany i widzę ekran powitalny.  
* ID: US-002  
* Tytuł: Logowanie do aplikacji  
* Opis: Jako zarejestrowany tester, chcę móc zalogować się do aplikacji przy użyciu mojego loginu i hasła.  
* Kryteria akceptacji:  
  1. Strona główna zawiera formularz logowania.  
  2. Po podaniu prawidłowych danych jestem zalogowany i przeniesiony do głównego panelu.  
  3. Po podaniu nieprawidłowych danych widzę komunikat o błędzie.  
  4. System oferuje opcję "zapomniałem hasła".  
* ID: US-003  
* Tytuł: Samouczek wprowadzający  
* Opis: Jako nowy użytkownik, po pierwszym zalogowaniu chcę przejść przez krótki, interaktywny samouczek, który pokaże mi, jak rozmawiać z AI, jak wpisywać wzory i gdzie znajdę mapę swoich postępów.  
* Kryteria akceptacji:  
  1. Samouczek uruchamia się automatycznie po pierwszym logowaniu.  
  2. Samouczek składa się z maksymalnie 3-4 kroków.  
  3. Użytkownik może pominąć samouczek i wrócić do niego później.  
  4. Samouczek demonstruje kluczowe funkcje: aktywację mikrofonu, pole tekstowe, przykładową wizualizację.

### **5.2. Proces Nauki**

* ID: US-004  
* Tytuł: Rozpoczęcie nowego działu  
* Opis: Jako uczeń, chcę wybrać z listy dział "Funkcje" i rozpocząć naukę od testu diagnostycznego, aby aplikacja poznała mój poziom.  
* Kryteria akceptacji:  
  1. W głównym panelu widzę listę działów zgodnych z programem matury podstawowej.  
  2. Po wybraniu działu, aplikacja informuje mnie o nadchodzącym teście diagnostycznym.  
  3. Test składa się z 3-5 pytań wielokrotnego wyboru lub z krótką odpowiedzią.  
  4. Po zakończeniu testu, AI proponuje pierwszy temat w dziale, dostosowany do wyników testu.  
* ID: US-005  
* Tytuł: Prowadzenie lekcji z AI  
* Opis: Jako uczeń, chcę prowadzić płynną rozmowę głosową z AI na temat funkcji liniowej, zadawać pytania i otrzymywać odpowiedzi w czasie rzeczywistym.  
* Kryteria akceptacji:  
  1. Interfejs ma wyraźny przycisk do aktywacji i dezaktywacji mikrofonu.  
  2. System poprawnie transkrybuje moje pytania wypowiadane w języku polskim.  
  3. Odpowiedzi AI są generowane w formie głosowej w czasie krótszym niż 3 sekundy.  
  4. Transkrypcja całej rozmowy (mojej i AI) jest widoczna na ekranie.  
* ID: US-006  
* Tytuł: Wprowadzanie wzorów matematycznych  
* Opis: Jako uczeń, podczas rozmowy o funkcji kwadratowej, chcę wpisać w polu tekstowym wzór "y \= 2x^2 \+ 3x \- 5", aby AI mogło się do niego odnieść.  
* Kryteria akceptacji:  
  1. Pole tekstowe jest zawsze widoczne obok okna konwersacji.  
  2. System poprawnie interpretuje standardowy zapis matematyczny, w tym potęgi (^), ułamki (/) i nawiasy.  
  3. Po wysłaniu wzoru, AI potwierdza jego zrozumienie i kontynuuje wyjaśnienia w jego kontekście.  
* ID: US-007  
* Tytuł: Prośba o wizualizację  
* Opis: Jako uczeń, który jest wzrokowcem, chcę powiedzieć "pokaż mi, jak wygląda wykres tej funkcji", aby AI wygenerowało i wyświetliło odpowiedni rysunek.  
* Kryteria akceptacji:  
  1. AI poprawnie interpretuje polecenie głosowe lub tekstowe dotyczące prośby o wizualizację.  
  2. W dedykowanym obszarze interfejsu pojawia się wygenerowany wykres z opisanymi osiami.  
  3. Wykres jest czytelny i dokładny merytorycznie.  
  4. AI potrafi odnosić się do wygenerowanego wykresu w dalszej części rozmowy.  
* ID: US-008  
* Tytuł: Proaktywne generowanie wizualizacji  
* Opis: Jako uczeń, który ma problem ze zrozumieniem układu równań, chcę, aby AI samo zaproponowało i narysowało interpretację geometryczną, nawet jeśli o to nie prosiłem.  
* Kryteria akceptacji:  
  1. AI, na podstawie predefiniowanych reguł (np. temat: układy równań), proaktywnie generuje wizualizację.  
  2. Wizualizacja pojawia się wraz z komentarzem głosowym, np. "Zobacz, narysujmy to, może tak będzie łatwiej zrozumieć...".  
* ID: US-009  
* Tytuł: Identyfikacja braku wiedzy i propozycja powtórki  
* Opis: Jako uczeń, podczas rozwiązywania zadania z logarytmów popełniam błąd w działaniach na potęgach. Chcę, aby AI to zauważyło i zaproponowało mi krótką powtórkę z potęg.  
* Kryteria akceptacji:  
  1. AI analizuje mój błędny wynik i identyfikuje jego prawdopodobną przyczynę w grafie wiedzy.  
  2. AI komunikuje: "Wygląda na to, że problem może leżeć w działaniach na potęgach. Czy chcesz zrobić krótką, 5-minutową powtórkę z tego tematu?".  
  3. Mam do wyboru opcje "Tak, poproszę" lub "Nie, dziękuję, kontynuujmy".  
* ID: US-010  
* Tytuł: Przeprowadzenie sesji powtórkowej  
* Opis: Jako uczeń, który zgodził się na powtórkę, chcę przejść przez kilka prostych zadań z potęgowania, a następnie płynnie wrócić do pierwotnego zadania z logarytmów.  
* Kryteria akceptacji:  
  1. Po akceptacji propozycji, system uruchamia mini-lekcję na zidentyfikowany temat.  
  2. Sesja powtórkowa składa się z teorii i 1-3 zadań sprawdzających.  
  3. Po poprawnym rozwiązaniu zadań, AI komunikuje: "Świetnie\! Wróćmy teraz do naszego zadania z logarytmami".  
  4. Kontekst pierwotnego zadania zostaje przywrócony.

### **5.3. Postępy i Zakończenie**

* ID: US-011  
* Tytuł: Śledzenie postępów w nauce  
* Opis: Jako uczeń, po zakończeniu sesji chcę wejść w zakładkę "Moje postępy" i zobaczyć, że dział "Funkcje" jest teraz oznaczony jako częściowo ukończony.  
* Kryteria akceptacji:  
  1. W interfejsie znajduje się wyraźnie oznaczona sekcja lub przycisk "Moje postępy".  
  2. Sekcja ta zawiera wizualną reprezentację wszystkich działów (np. w formie listy lub grafu).  
  3. Ukończone tematy w ramach działu są wyraźnie oznaczone.  
  4. Widoczny jest ogólny wskaźnik postępu dla całej ścieżki "Matura Podstawowa".  
* ID: US-012  
* Tytuł: Obsługa niejasnych pytań  
* Opis: Jako uczeń, zadaję pytanie spoza zakresu matematyki ("jaka jest jutro pogoda?"). Chcę, aby AI uprzejmie odmówiło odpowiedzi i skierowało rozmowę z powrotem na temat nauki.  
* Kryteria akceptacji:  
  1. System identyfikuje pytania, które nie są związane z matematyką.  
  2. AI odpowiada zgodnie ze swoją osobowością, np. "Jestem Twoim tutorem od matematyki i na tym znam się najlepiej. Może wrócimy do zadań?".  
  3. AI nie próbuje odpowiadać na pytania spoza swojej dziedziny.

## **6\. Metryki sukcesu**

### **6.1. Cele dla Zamkniętej Bety**

1. *Jakość i Stabilność Produktu:*  
   * Cel: Identyfikacja i naprawa co najmniej 50 błędów, w tym min. 10 krytycznych (uniemożliwiających naukę lub merytorycznych).  
   * Pomiar: Liczba zgłoszeń w systemie do śledzenia błędów, kategoryzowanych według priorytetu.  
2. *Walidacja Pętli Nauki i Adaptacji:*  
   * Cel: Osiągnięcie wskaźnika, w którym ponad 80% testerów ukończy co najmniej jeden pełny dział tematyczny (od testu diagnostycznego do zadania końcowego).  
   * Pomiar: Analiza logów systemowych śledzących postępy użytkowników.  
3. *Satysfakcja Użytkownika (Jakościowa):*  
   * Cel: Zebranie szczegółowych opinii na temat doświadczeń z nauki, jakości interakcji z AI oraz skuteczności mechanizmu adaptacyjnego.  
   * Pomiar: Przeprowadzenie ankiet satysfakcji i pogłębionych wywiadów z każdym z testerów po zakończeniu okresu testowego.

### **6.2. Kryteria Przejścia do Wersji Publicznej**

1. *Poprawność Merytoryczna:*  
   * Kryterium: Mniej niż 1 krytyczny błąd merytoryczny zgłaszany średnio na 10 sesji użytkownika.  
   * Pomiar: Analiza zgłoszeń od testerów i logów systemowych.  
2. *Rekomendacje i Lojalność:*  
   * Kryterium: Wskaźnik Net Promoter Score (NPS) wśród grupy beta-testerów na poziomie powyżej 40\.  
   * Pomiar: Ankieta NPS z pytaniem "Jak bardzo prawdopodobne jest, że polecisz AI Tutor znajomemu?".  
3. *Skuteczność Mechanizmu Adaptacji:*  
   * Kryterium: Co najmniej 75% ankietowanych testerów musi ocenić dopasowanie materiału do ich poziomu wiedzy jako "dobre" lub "bardzo dobre".  
   * Pomiar: Dedykowane pytania w ankiecie końcowej.