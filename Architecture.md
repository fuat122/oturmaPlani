# Architecture.md - Sistem ve Teknik Mimari

Bu doküman, Smart Classroom Seating (`oturmaPlani`) uygulamasının bileşen hiyerarşisini, veri akışını, güvenlik katmanını, rol tabanlı erişim kontrolünü ve dışa aktarma mekanizmasını açıklar.

---

### 1. Sistem Mimarisi Şeması

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│  [ALKEV Logo] ── [Sınıf Seçici] ── [Rol: Danışman / Branş] ── [Profil] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│         ClassroomToolbar             │  │     StudentObservationModal       │
│  - Akıllı Yerleştir (Auto-Seat)      │  │  - Öğrenci Ekle / Düzenle / Sil   │
│  - PDF İndir (Yalnızca Danışman)     │  │  - Cinsiyet & Ön Sıra İhtiyaçları │
│  - Yorum Raporu Al (Filtreli/Yazdır) │  │  - Birlikte Oturmayanlar Listesi  │
│  - Sınıf Genel Notu                  │  │  - Esnek pb-28 Kaydırma Alanı     │
│  - Canlı Dağılım Metrikleri          │  └─────────────────┬─────────────────┘
└──────────────────┬───────────────────┘                    │
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
│  [Kız: Açık Pastel Pembe] [Erkek: Açık Pastel Mavi]                    │
│  [Branş Modunda: Salt Okunur Kilit - Yorum/Koltuk Takası Kapalı]       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Isolated Sandbox IFrame A4 Landscape PDF Engine            │
│  - Tailwind v4 oklch() çökmesini önleyen izole <iframe> sandbox         │
│  - 1200px sabit genişlik, saf inline HEX renkler (#FDF2F8 / #EFF6FF)   │
│  - html2canvas (scale: 2) -> jsPDF (A4 landscape)                      │
│  - finally: iframe.remove() garantili temizlik                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Rol Tabanlı Yetkilendirme (RBAC)
- **Sınıf Rehber Öğretmeni (`advisory`):**
  - Sınıfın asil yöneticisidir.
  - Sıra takası (click-to-swap), yeni öğrenci ekleme, çıkarma ve düzenleme yapabilir.
  - Ders esnasında öğrencilere bireysel yorum ve sınıfa genel ders notu ekleyebilir.
  - Sınıfın A4 Yatay oturma planı PDF çıktısını indirebilir.
- **Branş Öğretmeni (`branch`):**
  - Sınıfa derse giren branş öğretmenleri içindir.
  - Yalnızca sınıfın oturma düzenini ve öğrenci listesini görüntüleyebilir.
  - Sıra değişikliği yapamaz, yorum ekleyemez ve PDF indiremez.
  - Arayüzde açıkça "Branş Öğretmeni Modu (Salt Okunur)" rozeti görüntülenir.

---

### 3. Güvenlik ve Kimlik Doğrulama Katmanı
- **Proje:** `oturma-plani-4448d`
- **Domain Kısıtı:** `@alkev.k12.tr`
- **Tetikleyiciler:**
  1. `signInWithGoogle`: Popup sonucunda dönen `result.user.email` test edilir. Uygun değilse anında `auth.signOut()` çağrılır.
  2. `onAuthStateChanged`: Dinleyici seviyesinde oturum kontrol edilir. Domain dışı kullanıcılar yakalandığında derhal oturum sonlandırılır.
- **Ekran Kilitlenmesi Koruması:** `try/catch/finally` mimarisinde `loading: false` güvence altına alınmıştır.

---

### 4. Veri Kalıcılığı ve Firebase Firestore Senkronizasyonu (`classroomService.ts`)
- **İki Katmanlı Hibrit Saklama:** Tüm sınıf ve öğrenci güncellemeleri hem `localStorage`'a anında yazılır hem de Firebase Firestore `classrooms` koleksiyonuna `setDoc` ile asenkron kaydedilir.
- **Öğrenci Yorumları ve Sınıf Günlüğü:** Bireysel öğrenci ders yorumları (`observations`) ve sınıf genel notları (`classroomLogs`) doğrudan öğrenci ve sınıf belgeleri içinde kalıcı olarak saklanır.
- **Silme Temizliği:** Bir öğrenci silindiğinde oturduğu sıra da otomatik olarak boşaltılarak veri bütünlüğü korunur.

---

### 5. Akıllı Oturma Algoritması (`seatingAlgorithm.ts`)
1. **Öncelik 1 (Ön Sıra Kuralı):** `specialNeeds.frontRowRequired === true` olan öğrenciler doğrudan 1. sıradaki masalara önceliklendirilir.
2. **Öncelik 2 (Ayrılma / Çatışma Kuralı):** `avoidWithStudentIds` listesinde birbirini içeren öğrenciler asla aynı sırada yan yana veya doğrudan komşu koltukta oturamaz.
3. **Öncelik 3 (Cinsiyet Dengesi):** Çiftli sıralarda kız-erkek uyumu gözetilerek pedagojik sınıf atmosferi dengelenir.
4. **Başarı Düzeyi:** Öğrencilerin başarı düzeylerine göre etiketlenmesi pedagojik prensip gereği kaldırılmıştır.
5. **Skorlama & Simülasyon:** 40 iterasyonluk Monte Carlo aramasında en yüksek pedagojik denge puanına sahip düzen seçilir.

---

### 6. OKLCH Hatasını Önleyen İzole IFrame PDF Motoru (`pdfExport.ts`)
- **Sorun Analizi:** Tailwind v4, global DOM'a `oklch()` formatında CSS değişkenleri enjekte eder. `html2canvas` bu renkleri ayrıştıramadığı için `Attempting to parse an unsupported color function "oklch"` hatası vererek çöker.
- **Mimari Çözüm:** PDF üretimi için gizli bir `<iframe>` (`display: none` veya `left: -9999px`) açılır. Iframe'in içi sıfırdan oluşturulan bağımsız bir HTML dokümanı ile doldurulur. Bu dokümanda hiçbir harici CSS veya Tailwind v4 değişkeni bulunmaz; tamamen inline HEX renkler (`#FFFFFF`, `#FDF2F8`, `#EFF6FF`, `#1E3A8A`) kullanılır. `html2canvas` iframe içerisindeki gövdeyi hatasız ve 2x retina netliğinde render eder, `jsPDF` ile A4 Yatay olarak kaydeder ve `finally` bloğunda iframe DOM'dan silinir.

---

### 7. Dağıtım ve Yayınlama (Deployment)
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
