# Balanso

Aplikacija za praćenje ishrane sa **bilansom kalorija**: sve što pojedeš minus ono što ti sat izmeri da si potrošio. Specifikacija je u Claude projektu „Tracking App“ (`balanso-specifikacija.md`).

**Faza 1 (ova verzija):** svi ekrani, 7 jezika (srpski, hrvatski, bosanski, nemački, engleski, španski, ruski), svetla i tamna tema, 88 namirnica iz USDA baze sa vitaminima i mineralima, jaja po veličini, odbitak kore, sopstveni obroci, početak dana za noćnu smenu, bilans sa ručno unetom potrošnjom i analiza. Podaci se čuvaju na telefonu.

Sledeće faze: nalog i sinhronizacija (Supabase), slikanje tablice i AI analiza, automatsko čitanje potrošnje sa sata (Apple Health / Health Connect), testiranje preko TestFlight-a i Google Play-a.

## Pokretanje na Windows-u (prvi put)

1. Instaliraj **Node.js LTS** sa https://nodejs.org (obična instalacija, sve „Next“).
2. Instaliraj **Git** sa https://git-scm.com/download/win (sve podrazumevano).
3. Na telefonu instaliraj aplikaciju **Expo Go** (App Store / Google Play).
4. Otvori **PowerShell** (Start → upiši „PowerShell“) i pokreni:

   ```powershell
   cd $HOME\Documents
   git clone https://github.com/IvicaM25/balanso.git
   cd balanso
   npm install
   npx expo start
   ```

5. Na ekranu se pojavi **QR kod**:
   - **iPhone:** skeniraj ga običnom kamerom.
   - **Android:** otvori Expo Go → „Scan QR code“.

Telefon i računar moraju biti na **istom Wi-Fi-ju**. Ako ne radi (npr. firma ili javni Wi-Fi), pokreni `npx expo start --tunnel`.

## Kasnije, kad stigne nova verzija

```powershell
cd $HOME\Documents\balanso
git pull
npm install
npx expo start
```

## Za razvoj

```bash
npm run typecheck   # TypeScript
npx expo lint       # lint
npm test            # testovi računanja (jaja, kora, zone bilansa, noćna smena, analiza)
```

Kod: `src/app` (ekrani, Expo Router), `src/lib` (računanje, bez UI-ja), `src/state/store.tsx` (podaci, jezik, tema), `src/i18n/strings.ts` (prevodi), `src/data/foods.json` (USDA SR28).
