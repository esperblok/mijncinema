# 🎬 MijnCinema — Film & Serie Dashboard

Een persoonlijk dashboard om films & series te ontdekken, te zoeken, details te bekijken
(poster, beschrijving, cast, rating, trailer) en je eigen **watchlist** + **gezien**-lijst bij te houden.
Inclusief legale **"waar te kijken"**-links (JustWatch via TMDB) en een verborgen beheer-dashboard.

> Data via [The Movie Database (TMDB)](https://www.themoviedb.org). Deze app is niet door TMDB onderschreven.

---

## 📁 Projectstructuur

```
site/
├── index.html              # de pagina
├── manifest.webmanifest    # maakt 'installeren' op telefoon/desktop mogelijk
├── css/
│   └── style.css           # alle styling
└── js/
    └── app.js              # alle logica
```

---

## ▶️ Lokaal gebruiken (op je eigen computer)

Dubbelklik op `index.html` — klaar. Open daarna **⚙️ Instellingen** en vul je gratis TMDB-sleutel in.

> Tip: sommige browsers werken iets prettiger als je het via een mini-webserver opent.
> Met Python (al geïnstalleerd op de meeste systemen):
> ```
> cd site
> python3 -m http.server 8000
> ```
> Ga dan naar http://localhost:8000

---

## 🔑 Gratis TMDB API-sleutel (nodig om data te laden)

1. Maak een gratis account op https://www.themoviedb.org/signup
2. Ga naar **Instellingen → API**: https://www.themoviedb.org/settings/api
3. Klik **"Create"** → kies **Developer** en vul het formulier in
   (bij website mag je `http://localhost` invullen)
4. Kopieer de **"API Key (v3 auth)"**
5. Open de app → **⚙️ Instellingen** → plak de sleutel → **Opslaan & testen**

---

## 🌍 Gratis online zetten

Kies één van deze. **Netlify Drop is het snelst** (geen account-gedoe).

### Optie A — Netlify Drop (slepen & neerzetten, ±1 minuut)
1. Ga naar https://app.netlify.com/drop
2. Sleep de **hele `site`-map** naar het vlak op de pagina
3. Je krijgt direct een live link (bijv. `https://iets-willekeurigs.netlify.app`)
4. Klaar! Open de link op je telefoon of deel 'm. (Gratis account = je kunt later updaten.)

### Optie B — GitHub Pages (gratis, met een eigen adres)
1. Maak een gratis account op https://github.com
2. Maak een nieuwe **repository** (bijv. `mijncinema`)
3. Upload de **inhoud van de `site`-map** (dus `index.html`, `css/`, `js/`, `manifest.webmanifest`)
4. Ga in de repo naar **Settings → Pages**
5. Bij "Branch" kies je `main` en map `/ (root)` → **Save**
6. Na ±1 minuut staat je site op `https://<jouwnaam>.github.io/mijncinema/`

### Optie C — Vercel
1. Account op https://vercel.com
2. "Add New → Project" → upload of koppel je map → Deploy

---

## 🔒 Verborgen beheer-dashboard

Klik **3× snel** op het **"🎬 MijnCinema"-logo** linksboven → voer het wachtwoord in.
Daarin: statistieken 📊, database beheren 🗂️ (import/export/wissen) en je eigen media-snelkoppelingen 🖥️.

> Let op: het wachtwoord staat in de code (`js/app.js`). Het is een leuk "geheim", **geen echte beveiliging**.

---

## ⚖️ Legaal

Deze app downloadt of host **geen** films/series. Het toont alleen informatie (via TMDB)
en verwijst naar **legale** streaming-/huur-/koopdiensten. Kijk altijd via officiële kanalen. 💛
