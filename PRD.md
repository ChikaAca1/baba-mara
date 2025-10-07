🧠 META PROMPT ZA CLAUDE CODE (verzija 1.0)

Naziv projekta: Baba Mara – AI Spiritual Advisor Platform
Verzija: 1.0
Autor: Aleksandar Jovanović
Glavni cilj: Claude Code kreira kompletan projekat baba-mara.com — platformu za digitalno proricanje sudbine (tumačenje šoljice kafe i tarot), sa fokusom na Tursko i englesko govorno tržište, baziranu na LiveKit, Supabase, Vercel i Payten integracijama.
Claude treba da razvija sistem kroz iteracije i automatski vodi sažet kontekst u context.md.

⚙️ TEHNIČKI OKVIR

Frontend Framework: Next.js 14 (App Router)
Deployment: Vercel (auto-deploy iz GitHub main)
Baza i autentifikacija: Supabase
Plaćanja: Payten API (koristi njihovu REST dokumentaciju)
AI govor: ElevenLabs free or cheep alternative  (voice agent only)
Video/Audio servis: LiveKit (za real-time voice call)
Repozitorijum: GitHub (main branch)
Jezici sajta:

🇹🇷 fal.baba-mara.com → babamara.com/tr

🇺🇸 mysticcup.baba-mara.com → babamara.com/en

🇷🇸 baba-mara.com/sr → baba-mara.com

💎 PRODUKTNI OPIS (PRD – Product Requirements Document)

Naziv: Baba Mara — Your Digital Fortune Teller
Opis:
Platforma koja omogućava korisnicima da virtuelno dobiju tumačenje sudbine putem glasa “Babe Mare”.
Korisnik postavlja pitanje (tekstom ili glasom), a AI generiše audio-odgovor (uz pomoć ElevenLabs ili nek jeftinije alternative) u mističnom tonu.
Tumačenja mogu biti pojedinačna ($1.99) ili deo mesečne pretplate ($9.99 za 12 tumačenja), sa mogućnošću dopune (“top-up”) od $9.99 za dodatnih 10 tumačenja.

Ključne funkcionalnosti:

Registracija / Login (Supabase Auth)

Email + lozinka

Google login

Po želji, anonimni “guest” način za prvo tumačenje

Dashboard korisnika

Pregled istorije tumačenja

Preostali broj tumačenja

Dugme “Postavi novo pitanje”

Tumačenje (Core AI modul)

Input: tekstualno pitanje korisnika

Output: audio poruka generisana ElevenLabs ili free or cheep alternative API-jem

U pozadini Claude ili sličan model generiše narativ i “ton tumačenja”

Plaćanje (Payten integracija)

Kupovina jednog tumačenja ($1.99)

Pretplata ($9.99 mesečno / 12 tumačenja)

Top-up ($9.99 / 10 tumačenja)

Payten API koristi REST (document-based integration)

Glasovni agent (LiveKit + ElevenLabs free or cheep alternative)

Glasovni chat u realnom vremenu (samo audio)

Avatar UI placeholder (za kasniju Heygen integraciju)

Admin panel (osnovni)

Pregled korisnika, transakcija, grešaka

Ručno resetovanje kredita korisnicima

Multi-language podrška (Next i18n)

Engleski, Turski, Srpski

Automatski kontekst menadžment (context.md)

Na svake 3–5 iteracije Claude automatski kompresuje istorijat u context.md

Fajl sadrži:

Datum

Šta je urađeno

Promene u kodu / arhitekturi

Potencijalne TODO sekcije

Git Workflow

Claude Code kreira projekat → automatski push na GitHub main

Deployment na Vercel (verifikacija builda)

Claude pita korisnika pre svakog git push

🔁 PROCES RADA (Iterativni razvoj)

Claude Code radi u ciklusima (3–5 iteracija):

Kreira početni kod i strukturu projekta

Implementira ključne integracije (Supabase, LiveKit, Payten)

Testira i ispravlja greške

Kompresuje kontekst u context.md

Čeka potvrdu za git push origin main

Auto-deploy na Vercel

📄 FAJLOVI I STRUKTURA
/baba-mara
├── app/
│   ├── tr/
│   ├── en/
│   ├── sr/
│   ├── components/
│   └── api/
├── lib/
│   ├── livekit/
│   ├── payten/
│   ├── supabase/
│   ├── elevenlabs/
├── context.md
├── README.md
└── .env.local

⚠️ PRAVNI I UX DISKLEJMER

Na svakoj jezičkoj verziji, Claude mora generisati sledeći disclaimer:

“Ova tumačenja generiše digitalni savetnik zasnovan na veštačkoj inteligenciji i namenjena su isključivo za zabavne i introspektivne svrhe. Nisu profesionalni saveti.”

🧩 KONTROLA I INTERAKCIJA SA ALEKSANDROM

Claude Code treba da:

traži od Aleksandra potvrdu pre svake promene u arhitekturi, plaćanjima i deploy-u,

automatski dokumentuje napredak u context.md,

koristi Claude 4.5 Sonnet i Claude Code model za razvoj i dokumentaciju.