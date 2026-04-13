# Pulse Dashboard

## Project

Een persoonlijk live dashboard met 17 widgets die actuele data tonen via de Anthropic API met web search. Gebouwd in Next.js met TypeScript en Tailwind CSS, gedeployed op Vercel.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS (alleen voor utilities waar nodig, de meeste styling is custom CSS)
- Vercel deployment
- Anthropic API (claude-sonnet-4-20250514 met web_search tool)

## Structuur

```
src/
  app/
    page.tsx          - Dashboard met alle widget componenten
    layout.tsx        - Root layout met fonts (Instrument Sans + JetBrains Mono)
    globals.css       - Alle custom CSS (variabelen, kaarten, animaties)
    api/
      widget/route.ts - POST proxy naar Anthropic API (met web_search tool)
      iss/route.ts    - GET proxy naar wheretheiss.at (CORS)
```

## Belangrijke aanpassingen t.o.v. artifact versie

1. `window.storage` vervangen door `localStorage` (notities widget)
2. Anthropic API calls gaan via `/api/widget` serverless route, NIET direct vanuit de client
3. ISS API calls gaan via `/api/iss` om CORS te vermijden
4. Google Fonts via `next/font/google` in layout.tsx
5. Alle componenten zijn client components (`"use client"`) omdat ze state/effects gebruiken
6. Environment variable: `ANTHROPIC_API_KEY` (in .env.local en Vercel)

## API Routes

### POST /api/widget
- Body: `{ prompt: string }`
- Stuurt prompt naar Anthropic API met web_search tool enabled
- Retourneert geparsed JSON uit het antwoord
- API key komt uit `process.env.ANTHROPIC_API_KEY`

### GET /api/iss
- Proxy naar `https://api.wheretheiss.at/v1/satellites/25544`
- Retourneert JSON met lat, lng, altitude, velocity

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Design

Kleurpalet gebaseerd op EngagePro esthetiek:
- Background: #0f1a0f (forest green)
- Card: #172017
- Lime accent: #c8f540
- Taupe secondary: #b8a88a
- Text: #e8eee4
- Fonts: JetBrains Mono (data), Instrument Sans (body)

## Widgets (17 totaal)

Static (geen API call):
1. Clock - live Amsterdam tijd
2. ISS Tracker - positie via /api/iss, canvas kaart
3. Pomodoro - 25/5 timer
4. Notes - localStorage, auto-save
5. CAMR 2026 - countdown naar 18 juli 2026

Dynamic (via /api/widget met Anthropic + web search):
6. Weer - Amsterdam temperatuur, voorspelling
7. Nieuws - top 6 headlines NL/internationaal
8. Beurzen - AEX, S&P 500, NASDAQ, DAX, Nikkei
9. Crypto - BTC, ETH, ADA, SOL, XRP
10. Sport - Eredivisie, CL, F1, tennis
11. F1 - WK stand top 8, volgende race
12. Astronomie - maanfase, ruimtenieuws
13. OV Storingen - NS treinen, snelwegen
14. Energie - EPEX stroomprijs, TTF gas
15. Valuta - EUR/USD, EUR/GBP, EUR/CHF, EUR/JPY
16. Zon & Maan - opkomst, ondergang, gouden uur
17. Citaat - filosofisch citaat (stoicisme, zen, etc)

## Project Pad

```
/Users/macbookteun/Library/Mobile Documents/com~apple~CloudDocs/Claude Backup /Pulse
```

## Deployment

```bash
vercel
```

Zet `ANTHROPIC_API_KEY` als environment variable in Vercel dashboard.
