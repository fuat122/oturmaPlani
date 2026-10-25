# Design System & Görsel Standartlar

Smart Classroom Seating (`oturmaPlani`) uygulaması, ALKEV Okulları'nın köklü kurumsal kimliğini yansıtan, modern, temiz ve akademik bir tasarım diline sahiptir.

---

### 1. Renk Paleti ve 60-30-10 Disiplini

| Kullanım Oranı | Rol | Değerler | Tailwind Karşılığı |
| :--- | :--- | :--- | :--- |
| **%60 (Canvas)** | Arka Plan Alanları | `#F8FAFC` / `#FFFFFF` | `bg-slate-50`, `bg-white` |
| **%30 (Strüktür)** | Kartlar, Sınırlar, Metin | `#0F172A`, `#E2E8F0`, `#334155` | `text-slate-900`, `border-slate-200` |
| **%10 (Vurgu)** | ALKEV Kurumsal Lacivert & Aksiyon | `#1E3A8A`, `#2563EB`, `#D97706` | `bg-blue-900`, `bg-blue-600`, `text-amber-600` |

#### Semantik Cinsiyet ve İhtiyaç Renkleri
- **Kız Öğrenciler:** `#7C3AED` (Mor / Lavanta tonları, `text-purple-700 bg-purple-50`)
- **Erkek Öğrenciler:** `#0284C7` (Mavi tonları, `text-blue-700 bg-blue-50`)
- **Ön Sıra Gereksinimi:** `#D97706` (Amber / Altın Sarısı, `text-amber-700 bg-amber-50`)
- **Çatışan / Ayrılmalı Eşleşmeler:** `#DC2626` (Kırmızı / Uyarı, `border-red-400 bg-red-50`)

---

### 2. Tipografi
- **Yazı Tipi:** `Plus Jakarta Sans` (Google Fonts)
- **Rakamlar & Kodlar:** `tabular-nums` ve `font-mono` (Öğrenci numaraları ve istatistik hizalamaları için)
- **Hiyerarşi:**
  - Hero / Sınıf Başlığı: 20px–24px Bold (`text-xl sm:text-2xl font-extrabold`)
  - Bölüm Başlıkları: 14px–16px Bold (`text-sm font-bold`)
  - Öğrenci İsimleri: 12px Bold (`text-xs font-bold`)
  - Meta Bilgiler: 10px–11px Medium (`text-[10px] text-slate-500`)

---

### 3. Anti-Slop & Tasarım Kuralları
1. **Zero-Pill Disiplini:** Sabit metin ve meta veriler hap/kapsül kutular içine alınmaz; zarif nokta (`·`) veya çizgi (`/`) ayraçlarıyla düz metin olarak sunulur.
2. **Doğal Başlıklar:** Kod tarzı `//` veya `>_` gibi sözde-teknik ön ekler yasaktır.
3. **Tek Seviye Yükseklik (Single Elevation):** Kart içinde kart gölgeleri yerine temiz kılcal sınırlar (`border border-slate-200`) tercih edilir.

---

### 4. Mobil ve Duyarlı Tasarım Standartları
- **Navbar:** `flex-col sm:flex-row` kuralı ile dar ekranlarda kırılma yapmadan dikey düzene geçer.
- **Kaydırma Alanları:** Modal içi listelerde mobil tarayıcıların alt çubuklarıyla çakışmayı önlemek için mutlaka `pb-28` esnek padding kullanılır.
- **Dokunma Hedefleri:** Butonlar ve koltuk slotları mobilde en az 44px dokunma alanına sahiptir.

---

### 5. PDF Çıktı Tasarım Standartları
- Sabit `1200px` genişlik.
- A4 Yatay (297mm × 210mm) ölçekleme.
- CSS değişkenleri yerine doğrudan inline standart HEX renkler (`#1E3A8A`, `#0F172A`, `#FFFFFF`).
- Çıktı üstünde "ALKEV ÖZEL OKULLARI" anteti, eğitim yılı, tarih, sınıf kroki matrisi ve imza blokları yer alır.
