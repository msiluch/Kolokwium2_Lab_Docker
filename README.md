# Laboratorium: Programowanie Aplikacji w Chmurze Obliczeniowej
Kolokwium 2  
Michał Siłuch  
grupa: 6.8  
numer albumu: 101662  
Data wykonania sprawozdania: 02.06.2026 r. 

## Sposób rozwiązania zadania
Proces w GitHub Actions został podzielony na dwie fazy:

1. **Test i skanowanie (Trivy):** Najpierw budowany jest tymczasowy obraz (linux/amd64), który ładuje się do lokalnego demona Dockera (load: true). Następnie skaner Trivy analizuje go pod kątem podatności. Dzięki parametrowi exit-code: 1 skaner działa jako bezpiecznik – jeśli znajdzie luki HIGH lub CRITICAL, całkowicie ubija potok i blokuje wysłanie zepsutego kodu.
2. **Budowa Multi-Arch:** Po zielonym świetle od Trivy, uruchamia się właściwy build na dwie architektury (linux/amd64, linux/arm64), a gotowy kontener trafia do GHCR.

## Strategia tagowania

**Tagowanie obrazów na GHCR:**
Wdrożenia nie opierają się wyłącznie na domyślnym tagu :latest. Zaimplementowałem dynamiczne tagowanie wykorzystujące skróty commitów Git, short-SHA (np. pogoda:sha-8a7c2b1). Opieranie potoków CI/CD wyłącznie na :latest ciągle nadpisuje obraz. W razie awarii na środowisku docelowym uniemożliwia to precyzyjne namierzenie commita, który spowodował błąd, co mocno utrudnia wycofanie zmian.  
Dobre praktyki dotyczące budowania i tagowania obrazów kontenerowych można znaleźć m.in. w artykule Google Cloud „7 Google best practices for building containers”: https://cloud.google.com/blog/products/containers-kubernetes/7-best-practices-for-building-containers 

**Dane Cache na DockerHub:**
Zamiast jednego wspólnego tagu dla pamięci podręcznej, cache jest tagowany dynamicznie nazwą gałęzi. Izoluje to cache gałęzi produkcyjnej od ewentualnych gałęzi deweloperskich, co zapobiega nadpisywaniu się warstw i usterkom na produkcji.
Dodatkowo włączyłem eksport pamięci w trybie maksymalnym (mode=max). Domyślny tryb zachowuje tylko warstwy finalnego obrazu. Tryb max zmusza silnik BuildKit do zrzucenia do cache'u absolutnie wszystkich warstw pośrednich – w tym etap pobierania zależności. Redukuje to czas kolejnych przebiegów potoku.

## Weryfikacja działania
Potok uruchamia się w pełni automatycznie przy zdarzeniu push na gałąź main. Potwierdzenie pomyślnego wykonania wszystkich kroków (w tym skanowania CVE i publikacji pakietów) znajduje się w zakładce **"Actions"** w tym repozytorium.
