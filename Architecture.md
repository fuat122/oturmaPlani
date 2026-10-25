# Architecture.md - Sistem ve Teknik Mimari

Bu doküman, Smart Classroom Seating (`oturmaPlani`) uygulamasının bileşen hiyerarşisini, veri akışını, güvenlik katmanını ve dışa aktarma mekanizmasını açıklar.

---

### 1. Sistem Mimarisi Şeması

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

### 2. Güvenlik ve Kimlik Doğrulama Katmanı
- **Proje:** `oturma-plani-4448d`
- **Domain Kısıtı:** `@alkev.k12.tr`
- **Tetikleyiciler:**
  1. `signInWithGoogle`: Popup sonucunda dönen `result.user.email` test edilir. Uygun değilse anında `auth.signOut()` çağrılır.
  2. `onAuthStateChanged`: Dinleyici seviyesinde oturum kontrol edilir. Domain dışı kullanıcılar yakalandığında derhal oturum sonlandırılır.
- **Ekran Kilitlenmesi Koruması:** `try/catch/finally` mimarisinde `loading: false` güvence altına alınmıştır.

---

### 3. Akıllı Oturma Algoritması (`seatingAlgorithm.ts`)
1. **Öncelik 1 (Ön Sıra Kuralı):** `specialNeeds.frontRowRequired === true` olan öğrenciler doğrudan 1. sıradaki masalara önceliklendirilir.
2. **Öncelik 2 (Ayrılma / Çatışma Kuralı):** `avoidWithStudentIds` listesinde birbirini içeren öğrenciler asla aynı sırada yan yana veya doğrudan komşu koltukta oturamaz.
3. **Öncelik 3 (Cinsiyet & Seviye Dengesi):** Çiftli sıralarda kız-erkek dağılımı ile akademik destek ihtiyacı olan öğrencilerin yanına rehberlik edebilecek akran yerleştirilir.
4. **Skorlama & Simülasyon:** 40 iterasyonluk Monte Carlo aramasında en yüksek pedagojik denge puanına sahip düzen seçilir.

---

### 4. PDF Motoru ve Ekran Dışı Render (`pdfExport.ts`)
- Ekran çözünürlüğünden, mobil tarayıcı zoom oranından veya responsive DOM taşmalarından etkilenmemek amacıyla `left: -9999px` konumunda 1200px genişlikte sanal bir A4 şablon oluşturulur.
- Başlık standardı: `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı`.
- Renkler standart HEX (`#1E3A8A`, `#0F172A`, `#FFFFFF`) olarak doğrudan inline atanır.
- İşlem bittiğinde `finally` bloğu DOM'u temizler.

---

### 5. Dağıtım ve Yayınlama (Deployment)
- **Depo (Repository):** `oturmaPlani`
- **GitHub Pages Base Yolu:** `base: '/oturmaPlani/'` (`vite.config.js` ve `vite.config.ts`)
- **Scriptler:**
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
  ```
- **gh-pages:** `npm run deploy` komutu ile `dist` içeriği doğrudan GitHub Pages dalına aktarılır.
