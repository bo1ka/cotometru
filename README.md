# Cotometru

Cote și predicții pentru emisiunile de tip reality. Fără bani, fără mize.

## Stack

- Astro (pagini statice)
- Cloudflare Workers static assets (hosting)
- Cloudflare Workers + D1 pentru voturi și predicții (pasul următor)

## Comenzi

```
npm install
npm run dev
npm run build
npm run deploy
```

## Conținut

- `src/data/shows.ts`: emisiuni, sezoane, cupluri, ediții, știri
- `src/data/site.ts`: setări generale. `demo: true` afișează banda "date de test"

Cotele din `shows.ts` sunt date de test până când există voturi reale.
