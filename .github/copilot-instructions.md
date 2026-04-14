# Project Guidelines

## Code Style
- TypeScript ve React TSX kullan. Yeni kodda tipleri açık tanımla; merkez domain tiplerini src/types.ts içinde tut.
- Import alias tercih et: @/components, @/lib, @/hooks. Göreli importları sadece yakın dosyalarda kullan.
- UI bileşenlerinde mevcut pattern'i koru:
  - Sayfa/domain bileşenleri: src/components
  - Paylaşılan UI primitive'ler: components/ui
- Tailwind class birleştirme için lib/utils.ts içindeki cn yardımcı fonksiyonunu kullan.
- Kullanıcıya görünen metinler mevcut projede Türkçe; yeni UI metinlerinde aynı dili koru.

## Architecture
- Frontend SPA girişi src/main.tsx ve ana orkestrasyon src/App.tsx.
- Sunucu katmanı server.ts:
  - Development: Vite middleware mode
  - Production: dist klasöründen static SPA serve
- Veri ve auth katmanı src/lib/firebase.ts:
  - Firebase app/auth/firestore init
  - Firestore işlemleri ve auth yardımcıları bu katmandan re-export edilir
- Güvenlik kuralları firestore.rules dosyasında; veri modeli referansı firebase-blueprint.json.

## Build And Test
- Kurulum: npm install
- Geliştirme: npm run dev
- Production build: npm run build
- Preview: npm run preview
- Type check: npm run lint
- Build sonrası agent değişikliklerinde en azından npm run lint çalıştır.

## Conventions
- Firestore real-time listener kullanılan her yerde cleanup içinde unsubscribe döndür.
- Firestore hatalarında src/lib/firebase.ts içindeki handleFirestoreError yaklaşımını izle (operation + path + auth bağlamı).
- Stripe akışı şu an devre dışı; yeni ödeme işi eklenirse server.ts içindeki mevcut comment blok yapısıyla uyumlu ilerle.
- Randevu/payment alanları için mevcut türleri koru (ör. paymentMethod alanı) ve tip güncellemesi gerekiyorsa önce src/types.ts güncelle.

## Environment And Pitfalls
- Yerelde çalışmak için .env.local içinde en az GEMINI_API_KEY gerekir (README.md).
- server.ts içinde Stripe client başlatması STRIPE_SECRET_KEY bekler; ödeme endpoint'i aktif değilse bile env yoksa davranışı kontrol ederek değiştir.
- HMR davranışı vite.config.ts içinde DISABLE_HMR env ile kontrol edilir; AI Studio senaryosu için mevcut ayarı bozma.

## References
- Kurulum ve hızlı başlangıç: README.md
- Veri modeli referansı: firebase-blueprint.json
- Firestore güvenlik kuralları: firestore.rules
- UI generator/alias ayarları: components.json
