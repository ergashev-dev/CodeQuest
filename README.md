# CodeQuest

CodeQuest — dasturlashni fantaziya sarguzashtining haqiqiy mexanikasiga aylantiradigan brauzer 2D action RPG. Hozirgi repozitoriy birinchi to‘liq o‘ynaladigan vertical slice: Greenhaven qishlog‘i, real-time jang va real JavaScript orqali dunyoni o‘zgartiradigan sehrli terminal.

## Ishlaydigan funksiyalar

- Kinematik landing, o‘zbekcha intro va animatsiyali character creator
- Phaser 3 asosidagi 2400×1600 ochiq Greenhaven hududi
- WASD harakat, Shift sprint, Space dash, mouse sword attack
- Kolliziyalar, silliq kamera, procedural daraxtlar, uylar, suv va firefly effektlari
- Idle/chase/attack/dead holatli Slime enemy
- Elder Syntax NPC, checkpoint va kontekstli `E` interaksiyasi
- Monaco Editor ko‘rinishidagi sehrli terminal
- QuickJS WebAssembly Web Worker ichida izolyatsiyalangan real JavaScript bajarilishi
- 1.5 soniyalik timeout; DOM, LocalStorage, cookie va network sandboxga ochilmagan
- To‘g‘ri koddan keyin kristall yonadi, fizik darvoza ochiladi, XP va tangalar beriladi
- IndexedDB versioned save, avtomatik checkpoint va Continue tugmasi
- Responsive fantasy UI, health/mana/XP HUD va pause menyusi

## O‘rnatish va ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda Vite ko‘rsatgan lokal manzilni oching. Production build:

```bash
npm run test
npm run build
npm run preview
```

## Boshqaruv

| Tugma | Amal |
| --- | --- |
| W A S D | Yurish |
| Shift | Yugurish |
| Space | Dash |
| Mouse chap tugmasi | Qilich hujumi |
| E | NPC, terminal yoki checkpoint bilan aloqa |
| Escape | Pauza |

## Kod challenge qanday ishlaydi

Monaco faqat tahrirlash interfeysi. Player kodi alohida Web Worker ichida QuickJS WASM kontekstida bajariladi. Worker browser DOM yoki ilova holatiga kira olmaydi. Natija oddiy serializatsiya qilingan qiymatlar sifatida qaytadi, validator ularni qat’iy tekshiradi, faqat shundan keyin Phaser dunyo effektini qo‘llaydi. Cheksiz sikl worker terminate qilinishi orqali to‘xtatiladi.

Qo‘llanmaydi: npm paket importlari, browser API’lari, DOM, fetch/network, LocalStorage va o‘zboshimcha game-state access. Ushbu milestone bitta JavaScript variables/boolean challenge bilan cheklangan; TypeScript diagnostics va SQL tizimi keyingi fazaga tegishli.

## Arxitektura

- `src/components` — React intro, creator, HUD va terminal overlay
- `src/game/scenes` — Phaser world, movement, combat, enemy FSM va interaction
- `src/game/systems` — IndexedDB persistence
- `src/coding/workers` — ishonchsiz kod uchun QuickJS worker
- `src/coding/runtime` — timeout va worker lifecycle
- `src/stores` — React/Phaser orasidagi typed Zustand state
- `src/tests` — sandbox semantik validatsiyasi

## Keyingi fazalar

15 missiya, qolgan regionlar, TypeScript/SQL challenge engine, barcha olti ability, inventar/skill tree, bosslar va to‘liq Uzbek/English i18n bu vertical slice’dan keyingi bosqichlar. README faqat real ishlaydigan milestone funksiyalarini “tayyor” deb ko‘rsatadi.
