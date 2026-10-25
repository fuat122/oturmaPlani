# Smart Classroom Seating (Akıllı Sınıf Oturma Planı)

ALKEV Özel Okulları standartlarına uygun, `@alkev.k12.tr` kurumsal domain güvenlikli, hatasız A4 yatay PDF çıktısı üreten, mobil uyumlu ve pedagojik denge odaklı akıllı sınıf oturma planı uygulaması.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Aşağıdaki kararlar netleştirilmiş olup uygulamada bu doğrultuda hayata geçirilecektir:

- **Confirmed Decision 1 (Oturma Algoritması)**: Kapsamlı denge kriteri (ön sıra görme/işitme ihtiyaçları, cinsiyet dengesi, akademik başarı dağılımı ve davranışsal ayrıştırma) kombine olarak çalışacaktır.
- **Confirmed Decision 2 (Oturma Düzeni)**: Klasik ikili sıra yerleşimi (koridorlu sıralar, tahta/öğretmen masası yönlendirmesi) temel alınacaktır.
- **Confirmed Decision 3 (Kimlik Doğrulama)**: Firebase Auth ile gerçek Google `@alkev.k12.tr` girişi + AI Studio geliştirme/önizleme ortamı için test öğretmeni girişi (`ogretmen@alkev.k12.tr`) birlikte sunulacaktır.

---

### 1. Overview & Core Concept

- **What It Does**: Öğretmenlerin sınıflarını (şube, öğrenci listesi, danışman öğretmen) yönetmesini, öğrencilerin pedagojik özelliklerine göre (görme/işitme engeli, akademik seviye, cinsiyet ve davranışsal uyarılar) tek tıkla dengeli oturma planı oluşturmasını, el ile sıralar arası sürükle-bırak yapabilmesini ve matbaa/baskı kalitesinde A4 Yatay PDF karnesi üretmesini sağlar.
- **Target Audience / Persona**: ALKEV Okulları sınıf rehber öğretmenleri, branş öğretmenleri, müdür yardımcıları ve okul psikolojik danışmanlık ve rehberlik (PDR) servisi.
- **Key Value**: Seating düzenlemelerinde yaşanan zaman kaybını ortadan kaldırır, veli ve öğrenci memnuniyetini artıracak adil/dengeli bir oturma düzeni sağlar ve kurumsal kimlik standartlarında raporlama sunar.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Güvenli Giriş & Domain Filtresi**:
   - Kullanıcı Google ile giriş yapar. E-posta `@alkev.k12.tr` uzantılı değilse anında `auth.signOut()` çağrılır, hata mesajı gösterilir ve kullanıcı giriş ekranında tutulur (`loading: false`).
   - Önizleme/test amaçlı tek tıkla test öğretmeni modu sağlanır.
2. **Sınıf & Şube Seçimi / Yönetimi**:
   - Üst barda (Navbar) mobil uyumlu (`flex-col sm:flex-row`) sınıf seçici, danışman öğretmen bilgisi ve yeni sınıf ekleme/düzenleme kontrolleri.
3. **İnteraktif Sınıf Tahtası & Sıra Matrisi**:
   - Ön tarafta "Öğretmen Kürsüsü & Akıllı Tahta" görsel kılavuzu.
   - 2'li sıra blokları, her sırada öğrenci kartı (cinsiyet ikonu, görme/işitme rozeti, başarı göstergesi).
   - Öğrencileri sıralar arasında kolayca yer değiştirme (Swap / Drag-and-drop).
4. **Akıllı Yerleşim & Optimizasyon**:
   - "Akıllı Yerleştir" butonu ile öncelik kurallarını işleten simülasyon motoru.
5. **Öğrenci Gözlem & Takip Paneli**:
   - Modal pencerede öğrenci listesi, notlar, etiketler ve `pb-28` esnek alt boşluğu ile kesintisiz kaydırma.
6. **Sıfır Çökme Garantili PDF Dışa Aktarma**:
   - Ekrana bağımlı kalmadan arka planda (`left: -9999px`) 1200px sabit genişlikli, standart HEX renkli A4 Yatay şablon render edilir.
   - `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı` başlığı ile `html2canvas` + `jsPDF` üzerinden tek tıkla yüksek çözünürlüklü PDF indirilir.

#### Visual Identity & Theme
- **Aesthetic Direction**: ALKEV kurumsal lacivert ve altın sarısı dokunuşlarına sahip, modern, temiz, güven verici akademik arayüz.
- **Color Palette**:
  - *Dominant Canvas*: `#F8FAFC` (Slate-50) & `#FFFFFF`
  - *Structural Surfaces*: `#0F172A` (Navy/Slate-900) ve `#E2E8F0` (Border)
  - *Accent*: ALKEV Kurumsal Laciverti (`#1E3A8A`) & Akademik Mavi (`#2563EB`)
  - *Semantic Accents*: Kız/Erkek dağılımı için soft lavanta (`#4F46E5`) / safir (`#0284C7`), Görme/İşitme önceliği için sarı (`#D97706`).
- **Typography**: Display & arayüz için `Plus Jakarta Sans` / `Outfit`, öğrenci numaraları ve istatistikler için `tabular-nums`.

---

### 3. Key Product Decisions & Trade-Offs

- **Off-Screen Fixed-Width PDF Engine**:
  - *Karar*: Ekranda kullanıcı tarafından boyutlandırılmış veya taşma yapabilecek DOM yerine, DOM dışında 1200px genişlikte pikselleri kesin olarak hesaplanan A4 Yatay bir şablon oluşturulup PDF'e dönüştürülmesi.
  - *Neden*: Mobil ve dar ekranlarda `html2canvas`'ın kırpma, kaydırma çubuğu veya bozuk font render etmesi sıfıra indirilir.
- **Domain Gate Enforcement (`@alkev.k12.tr`)**:
  - *Karar*: Hem `signInWithPopup` sonrasında hem de Firebase `onAuthStateChanged` tetiklendiğinde e-posta domain denetimi yapılır. Yetkisiz girişlerde derhal oturum sonlandırılır.
  - *Neden*: Kurum dışı Google hesaplarının öğrenci verilerine erişimi kesin olarak engellenir.
- **State Management & Persistence**:
  - *Karar*: Firebase Firestore senkronizasyonu ile birlikte kesintisiz offline/localStorage yedeklemesi.
  - *Neden*: İnternet dalgalanmalarında veya Firestore kural gecikmelerinde öğretmenin yaptığı oturma planı asla kaybolmaz.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│  [ALKEV Wordmark] ── [Sınıf Seçimi: 9-A, 10-B...] ── [Kullanıcı/Çıkış] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     Sınıf Tahtası & Kontrol Barı     │  │     Öğrenci Yönetim & Havuz       │
│  - "Akıllı Yerleştir (Auto-Seat)"    │  │  - Öğrenci Ekle / Düzenle         │
│  - "PDF İndir (A4 Yatay)"            │  │  - İhtiyaç & Başarı Etiketleri    │
│  - "Temizle / Sıfırla"               │  │  - Yerleşmemiş Öğrenci Listesi    │
└──────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                   │                                        │
                   ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Sınıf Matrisi (2'li Sıralar)                       │
│  [Öğretmen Masası & Tahta]                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ Sıra 1 (S-Sol│   │ Sıra 2 (Orta)│   │ Sıra 3 (Sağ) │ (Ön Sıra)      │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ Sıra 4       │   │ Sıra 5       │   │ Sıra 6       │ (Arka Sıra)    │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Off-Screen High-Fidelity A4 Landscape PDF Engine           │
│  - Sabit 1200px genişlik, inline HEX renkler, kurumsal antet          │
│  - html2canvas -> jsPDF -> print/download -> DOM temizliği             │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Models
```typescript
interface Student {
  id: string;
  number: string;
  name: string;
  gender: 'female' | 'male';
  academicLevel: 'high' | 'medium' | 'developing';
  specialNeeds: {
    frontRowRequired: boolean; // Görme / İşitme gereksinimi
    notes?: string;
  };
  avoidWithStudentIds: string[]; // Birlikte oturmaması gerekenler
  observationNotes?: string;
}

interface DeskSlot {
  deskId: string;
  row: number;
  column: number;
  seatPosition: 'left' | 'right';
  studentId: string | null;
}

interface Classroom {
  id: string;
  name: string; // Örn: 9-A
  advisoryTeacher: string; // Danışman Öğretmen
  academicYear: string; // 2026-2027
  rowsCount: number;
  columnsCount: number;
  students: Student[];
  layout: DeskSlot[];
}
```

---

### 5. Implementation Steps & Verification Plan

1. **Paket ve Yapılandırma**:
   - `package.json` içine `build`, `predeploy`, `deploy` (`gh-pages -d dist`) ekleme.
   - Gerekli kütüphaneleri yükleme (`jspdf`, `html2canvas`, `firebase`).
   - `vite.config.ts`: Base URL yapılandırması (`/oturma_plani/`).
2. **Kimlik Doğrulama & ALKEV Domain Güvenliği**:
   - `src/lib/firebase.ts` ve `src/context/AuthContext.tsx`.
   - `@alkev.k12.tr` kuralı kontrolü, hatalı durumlarda `signOut()` ve kullanıcı bilgilendirmesi.
   - Demo / Test Öğretmen modu.
3. **Akıllı Oturma Motoru (`seatingAlgorithm.ts`)**:
   - Ön sıra görme/işitme öncelikleri yerleşimi.
   - Çiftli sıralarda cinsiyet ve akademik seviye dengelemesi.
   - Birlikte oturmaması gereken öğrencileri ayırma.
4. **A4 Yatay PDF Şablonu & Dışa Aktarıcı (`pdfExport.ts`)**:
   - Ekran dışı 1200px sabit genişlikli canvas render motoru.
   - `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı` başlığı.
5. **UI & Mobil Uyum (Tailwind CSS)**:
   - Esnek Navbar (`flex-col sm:flex-row`).
   - Öğrenci Gözlem Paneli alt boşluğu (`pb-28`).
   - Sürükle-bırak veya tek tıkla koltuk değiştirme (swap) kontrolü.
6. **Dokümantasyon Dosyaları**:
   - Proje kökünde `PRD.md`, `AGENTS.md`, `Design-System.md`, `Architecture.md` eksiksiz oluşturulması.
7. **Doğrulama**:
   - `compile_applet` ile sıfır derleme hatasının doğrulanması.
