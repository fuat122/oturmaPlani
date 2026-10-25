# Smart Classroom Seating (Akıllı Sınıf Oturma Planı) - `oturmaPlani`

Yeni `oturmaPlani` GitHub deposuna tam uyumlu, ALKEV Özel Okulları kurumsal standartlarında, `@alkev.k12.tr` domain güvenlikli, hatasız A4 yatay PDF motoruna ve esnek mobil arayüze sahip akıllı oturma planı mimarisi.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Kullanıcının yeni talebi doğrultusunda aşağıdaki yapılandırma güncellemeleri uygulanacaktır:

- **Base Yolu & Dağıtım**: `vite.config.js` / `vite.config.ts` içerisinde GitHub Pages base yolu doğrudan `base: command === 'serve' ? '/' : '/oturmaPlani/'` (veya `base: '/oturmaPlani/'`) olarak yapılandırılacaktır. `vite.config.ts` sunucu portu `port: 3000` ve `host: '0.0.0.0'` olarak sabitlenerek `"dev": "vite"` scriptiyle eksiksiz uyum sağlanacaktır.
- **Scripts Güncellemesi**: `package.json` içerisindeki `"scripts"` bloğu birebir kullanıcının belirttiği şekilde ayarlanacaktır:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
  ```
- **gh-pages Bağımlılığı**: `gh-pages` paketi devDependencies altında hazır tutulacaktır.
- **Domain Kısıtlaması (@alkev.k12.tr)**: Hem `signInWithPopup` hem de `onAuthStateChanged` içinde e-posta domain denetimi sürdürülecek; yabancı domain ile girişte derhal `auth.signOut()` çağrılacak, uyarı gösterilecek ve ekranın kilitlenmemesi için `loading: false` çekilecektir.
- **Mobil & PDF Çözümü**: Navbar `flex-col sm:flex-row`, Öğrenci Gözlem Paneli alt boşluğu `pb-28`, PDF motoru ekran dışı (off-screen, `left: -9999px`) 1200px sabit genişlikli standart HEX renkli A4 Yatay şablon olarak korunacaktır.
- **Dokümantasyon Senkronizasyonu**: `PRD.md`, `AGENTS.md`, `Design-System.md` ve `Architecture.md` dosyaları yeni `oturmaPlani` yapısına göre güncellenecektir.

---

### 1. Overview & Core Concept

- **What It Does**: ALKEV Okulları öğretmenlerinin sınıf oturma planlarını pedagojik kriterler (görme/işitme ihtiyaçları, cinsiyet dengesi, akademik seviye karması ve davranışsal ayrıştırma) doğrultusunda tek tıkla düzenlemesini, çiftli sıralar arasında sürükle-bırak/takas yapabilmesini ve matbaa kalitesinde A4 Yatay PDF çıktısı almasını sağlar.
- **Depo & Canlı Yayın**: GitHub Pages üzerinde `/oturmaPlani/` alt yolunda çalışır.

---

### 2. User Experience & Visual Design

- **Mobil Uyumlu Navbar**: Küçük ekranlarda `flex-col`, masaüstünde `sm:flex-row` olarak düzenlenir. Logo, sınıf seçici ve profil alanı dikey taşma yapmaz.
- **Öğrenci Takip & Gözlem Paneli**: Kaydırma listesinin altında `pb-28` esnek padding bulunur, son öğrenciler mobil cihazlarda daima görünür ve erişilebilirdir.
- **İnteraktif Sınıf Izgarası**: Tahta ve öğretmen kürsüsü ön planda, 2'li sıra blokları, koltuk takası için seçim ve hedef tıklama, yerleşmemiş öğrenciler havuzu.
- **Görsel Standartlar**: ALKEV Kurumsal Lacivert (`#1E3A8A`) ve Altın Sarısı (`#D97706`), `Plus Jakarta Sans` yazı tipi, `tabular-nums` rakamlar.

---

### 3. Key Product Decisions & Trade-Offs

- **Base Path & Dev Server**:
  - `vite.config.ts`: `base: command === 'serve' ? '/' : '/oturmaPlani/'` ayarı hem GitHub Pages (`npm run deploy`) yapısını eksiksiz karşılar hem de AI Studio önizleme ortamında kök yoldan kesintisiz çalışmayı garanti eder. Ayrıca `vite.config.js` dosyası da projeye eklenerek iki dosya yapısı da desteklenir.
  - `server: { port: 3000, host: '0.0.0.0' }` ayarı sayesinde `"dev": "vite"` scripti doğrudan 3000 portunda başlar.
- **Sıfır Çökme Garantili PDF Motoru**:
  - Responsive ekran DOM'unu kopyalamak yerine, 1200px sabit genişlikte ekran dışı (`left: -9999px`) A4 şablon oluşturulur.
  - Başlık: `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı`.
  - `html2canvas` ve `jsPDF` çıktısı indikten sonra `finally` bloğu DOM'u temizler.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│  [ALKEV Brand] ── [Sınıf Seçici: 9-A, 10-B...] ── [Kullanıcı & Çıkış]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│         ClassroomToolbar             │  │     StudentObservationModal       │
│  - Akıllı Yerleştir (Auto-Seat)      │  │  - Öğrenci Ekle / Düzenle         │
│  - PDF İndir (A4 Yatay)              │  │  - Görme/İşitme Gereksinimleri    │
│  - Sıraları Temizle / Sıfırla        │  │  - Birlikte Oturmayanlar Listesi  │
│  - Anlık Pedagojik Denge Metrikleri  │  │  - Esnek pb-28 Kaydırma Alanı     │
└──────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                   │                                        │
                   ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      ClassroomGrid (2'li Sıralar)                      │
│  [Öğretmen Kürsüsü & Akıllı Tahta]                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ 1. Sıra Sol  │   │ 1. Sıra Orta │   │ 1. Sıra Sağ  │ (Ön Sıra)      │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ 2. Sıra Sol  │   │ 2. Sıra Orta │   │ 2. Sıra Sağ  │                │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│  [Yerleşmemiş Öğrenci Havuzu / Drawer]                                │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Off-Screen High-Fidelity A4 Landscape PDF Engine           │
│  - left: -9999px; width: 1200px; inline HEX renkler                    │
│  - html2canvas (scale: 2) -> jsPDF (landscape) -> pdf.save()           │
│  - finally: DOM temizliği (removeChild)                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Implementation Steps & Verification Plan

1. **Vite ve Package.json Yapılandırması**:
   - `vite.config.ts` ve `vite.config.js`: `base: command === 'serve' ? '/' : '/oturmaPlani/'` ve `server: { port: 3000, host: '0.0.0.0' }`.
   - `package.json`:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
     ```
   - `gh-pages` bağımlılığı kontrolü.
2. **Firebase & Domain Doğrulaması**:
   - `oturma-plani-4448d` yapılandırması ve `@alkev.k12.tr` kısıtlaması, `auth.signOut()`, `loading: false`.
3. **Mobil ve PDF İyileştirmeleri**:
   - `Navbar`: `flex-col sm:flex-row`.
   - `StudentObservationModal`: `pb-28`.
   - `pdfExport`: 1200px sabit genişlikli A4 Yatay motoru.
4. **Dokümantasyon Güncellemeleri**:
   - `PRD.md`, `AGENTS.md`, `Design-System.md`, `Architecture.md` dosyalarının `oturmaPlani` adıyla güncellenmesi.
5. **Doğrulama**:
   - `compile_applet` ve `lint_applet` ile sıfır hata testi.
