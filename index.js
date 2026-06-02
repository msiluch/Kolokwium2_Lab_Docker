require('dotenv').config({ quiet: true }); // Ładowanie zmiennych środowiskowych z pliku .env
const express = require('express');
const app = express();
const axios = require('axios'); // Biblioteka axios wykorzystywana do komunikacji z API OpenWeatherMap
const PORT = process.env.PORT || 3000; // Port aplikacji, domyślnie 3000
const Autor = "Michał Siłuch"; // Dane autora
const Api = process.env.OPENWEATHER_API_KEY; // Klucz API do OpenWeatherMap pobierany ze zmiennej środowiskowej

// Endpoint główny wyświetlający stronę z formularzem wyboru kraju i miasta
app.get('/', (req, res) => {
    res.type('text/html');
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Aplikacja Pogodowa</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                select, button { padding: 5px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sprawdź pogodę</h1>
                
                <form action="/pogoda" method="GET"> 
                    <label for="kraj">Wybierz kraj:</label><br>
                    <select id="kraj" name="kraj" onchange="zaktualizujMiasta()" required>
                        <option value="">Wybierz kraj</option>
                        <option value="PL">Polska</option>
                        <option value="EG">Egipt</option>
                        <option value="NO">Norwegia</option>
                    </select> 
                    <br><br>

                    <label for="miasto">Wybierz miasto:</label><br>
                    <select id="miasto" name="miasto" required>
                        <option value="">Najpierw wybierz kraj</option>
                    </select>
                    <br><br>
                    
                    <button type="submit">Sprawdź pogodę</button>
                </form>
            </div>

            <script>
                // Obiekt zawierający listę krajów oraz przypisanych do nich miast
                const bazaMiast = {
                    "PL": [{nazwa: "Lublin", wartosc: "Lublin"}, {nazwa: "Warszawa", wartosc: "Warsaw"}, {nazwa: "Kraków", wartosc: "Krakow"}],
                    "EG": [{nazwa: "Kair", wartosc: "Cairo"}, {nazwa: "Aleksandria", wartosc: "Alexandria"}, {nazwa: "Giza", wartosc: "Giza"}],
                    "NO": [{nazwa: "Oslo", wartosc: "Oslo"}, {nazwa: "Bergen", wartosc: "Bergen"}, {nazwa: "Stavanger", wartosc: "Stavanger"}]
                };

                // Funkcja aktualizuje listę widocznych na stronie miast po zmianie wybranego kraju
                function zaktualizujMiasta() {
                    const wybranyKraj = document.getElementById("kraj").value;
                    const miastoSelect = document.getElementById("miasto");

                    // Usunięcie wszystkich istniejących opcji z listy miast
                    miastoSelect.innerHTML = "";

                    if(wybranyKraj && bazaMiast[wybranyKraj]) {
                        // Dodanie nowych opcji na podstawie wybranego kraju
                        bazaMiast[wybranyKraj].forEach(miasto => {
                            // Utworzenie elementu <option> dla każdego miasta i dodanie go do listy
                            const opcja = document.createElement("option");
                            opcja.value = miasto.wartosc;
                            opcja.text = miasto.nazwa;
                            // Dodanie opcji do elementu select
                            miastoSelect.appendChild(opcja);
                        });
                    } else {
                        // Powrót do stanu domyślnego
                        const opcja = document.createElement("option");
                        opcja.value = "";
                        opcja.text = "Najpierw wybierz kraj";
                        miastoSelect.appendChild(opcja);
                    }
                }
            </script>
        </body>
        </html>
    `);
});


// Endpoint obsługujący zapytania o pogodę, pobierający dane z API OpenWeatherMap i wyświetlający je w formacie HTML
app.get('/pogoda', async(req, res) => {
    // Pobranie parametrów miasto i kraj z zapytania
    const miasto = req.query.miasto;
    const kraj = req.query.kraj;

    if (!Api) {
        return res.status(500).send("Brak konfiguracji OPENWEATHER_API_KEY. Uzupełnij plik .env i uruchom aplikację ponownie.");
    }

    if (!miasto || !kraj) {
        return res.status(400).send("Brak wymaganych parametrów. <a href='/'>Wróć do formularza</a>");
    }

    try {
        // Wysłanie zapytania do API OpenWeatherMap z wykorzystaniem biblioteki axios
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${miasto},${kraj}&APPID=${Api}&units=metric&lang=pl`)
        const danePogodowe = response.data;

        const nazwaMiasta = danePogodowe.name;
        const temperatura = danePogodowe.main.temp;
        const temperaturaOdczuwalna = danePogodowe.main.feels_like;
        const opisPogody = danePogodowe.weather[0].description;
        const wilgotnosc = danePogodowe.main.humidity;
        const wiatr = danePogodowe.wind.speed;

        res.type('text/html');
        res.send(`
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <title>Pogoda w ${nazwaMiasta}</title>
            </head>
            <body>
                <h1>Pogoda w ${nazwaMiasta}</h1>
                <p>Temperatura: ${temperatura}°C</p>
                <p>Temperatura odczuwalna: ${temperaturaOdczuwalna}°C</p>
                <p>Opis pogody: ${opisPogody}</p>
                <p>Wilgotność: ${wilgotnosc}%</p>
                <p>Prędkość wiatru: ${wiatr} m/s</p>
            </body>
        </html>
        `
    )
    } catch (error) {
        console.error("Błąd podczas pobierania danych pogodowych:", error.message);
        res.status(500).send("Wystąpił błąd podczas pobierania danych pogodowych. <a href='/'>Wróć do formularza</a>");
    }
    }
);


app.listen(PORT, () => {
    console.log("Po uruchomieniu:");
    console.log(`Data: ${new Date().toISOString()}`);
    console.log(`Imie i nazwisko autora programu: ${Autor}`);
    console.log(`Aplikacja działa na porcie: ${PORT}`);
});