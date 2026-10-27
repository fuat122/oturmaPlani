# AGENTS.md - Geliştirici ve Agent Kuralları Kılavuzu

Bu dosya, Smart Classroom Seating (Akıllı Sınıf Oturma Planı) projesinde kod geliştiren tüm mühendislerin ve AI agent'ların uyması gereken katı kuralları tanımlar.

---

### 1. Temel İlkeler ve Değişmezler (Invariants)

1. **Domain Güvenliği (@alkev.k12.tr)**:
   - Asla ve hiçbir koşulda domain denetimini devreden çıkarmayınız.
   - Hem `signInWithPopup` sonrasında hem de `onAuthStateChanged` içinde domain kontrolü yapılmalıdır.
   - `@alkev.k12.tr` ile bitmeyen adreslerde `auth.signOut()` çağrılmalı ve `loading` her durumda `false` yapılmalıdır.
   - Giriş ekranındaki uyarı metnini değiştirmeyiniz:  
     `"ℹ️ Yalnızca @alkev.k12.tr uzantılı kurumsal e-posta adresleri kabul edilmektedir."`

2. **PDF Motoru Mimarisi & OKLCH Koruma**:
   - Asla ekrandaki responsive arayüzü doğrudan `html2canvas`'a vermeyiniz.
   - Tailwind v4'ün enjekte ettiği `oklch()` renk fonksiyonlarının `html2canvas` motorunu çökertmesini önlemek için, PDF render işlemi izole bir `<iframe>` (sandbox) içerisinde, yalnızca standart HEX renk kodları (`#FFFFFF`, `#FDF2F8`, `#EFF6FF`, vb.) ve inline CSS ile gerçekleştirilmelidir.
   - Başlık kesinlikle `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı` formatında olmalıdır.
   - DOM temizliğini daima `finally` bloğunda yapınız (`iframe.remove()`).

3. **Rol Tabanlı Erişim Denetimi**:
   - Sınıf Rehber Öğretmeni: Sıra düzenleme, koltuk takası, öğrenci ekleme/çıkarma, ders yorumu ve PDF indirme yetkisine sahiptir.
   - Branş Öğretmeni: Sınıf düzenini yalnızca görüntüleyebilir. Sıra yer değişikliği yapamaz, yorum ekleyemez ve PDF indiremez.

4. **Öğrenci Sıra Renkleri & Başarı Düzeyi**:
   - Kız öğrenciler için açık pastel pembe zemin (`#FDF2F8` / `bg-pink-50/70`, border `#FBCFE8` / `border-pink-200`).
   - Erkek öğrenciler için açık pastel mavi zemin (`#EFF6FF` / `bg-sky-50/70`, border `#BFDBFE` / `border-sky-200`).
   - Öğrencilerin başarı düzeyleri (ileri/orta/destek) arayüzden ve algoritmalardan tamamen kaldırılmıştır; pedagojik denge ön sıra ihtiyaçları, çatışma ayrıştırması ve cinsiyet uyumuna odaklanır.

5. **Kurumsal Logo**:
   - Resmi ALKEV logosu `/public/assets/aistudio/alkev-logo-tr-2025_552f0d5d.png` dosyasından kullanılır.

6. **Mobil Uyumluluk & Padding**:
   - Navbar bileşeni dikey/esnek düzende (`flex-col sm:flex-row`) kalmalıdır.
   - Öğrenci Takip & Gözlem Paneli içindeki kaydırılabilir alanda `pb-28` padding değeri korunmalıdır.

7. **GitHub Pages Dağıtımı & Vite Yapılandırması**:
   - `vite.config.js` ve `vite.config.ts`: `base: command === 'serve' ? '/' : '/oturmaPlani/'` kuralına sadık kalmalıdır.
   - `package.json` içindeki betikler:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
     ```
   - `gh-pages` paketi bağımlılıklarda korunmalıdır.

---

### 2. Dosya Organizasyonu ve Sorumluluklar
- `src/context/AuthContext.tsx`: Firebase kimlik doğrulama, domain filtreleme ve test oturumu.
- `src/lib/firebase.ts`: Firebase istemci başlatma ve `isAlkevEmail` fonksiyonu (`oturma-plani-4448d`).
- `src/utils/pdfExport.ts`: İzole iframe tabanlı, HEX renkli A4 Yatay PDF üretim motoru.
- `src/utils/seatingAlgorithm.ts`: Çok kriterli akıllı oturma ve pedagojik denge algoritması.
- `src/components/Navbar.tsx`: Mobil duyarlı kurumsal üst bar, ALKEV logosu ve rol seçici.
- `src/components/ClassroomGrid.tsx`: İnteraktif çiftli sıra matrisi, pastel cinsiyet kartları ve rol kısıtlamaları.
- `src/components/StudentObservationModal.tsx`: Öğrenci profilleri, özel ihtiyaçlar ve gözlem notları.
- `src/components/StudentReportModal.tsx`: Konsolide öğrenci ders yorumları dökümü ve yazdırma paneli.
- `src/components/ObservationCommentModals.tsx`: Bireysel ders içi ve sınıf genel notu modalları.
- `src/components/ClassroomToolbar.tsx`: Aksiyon butonları, PDF indirme, yorum raporu ve denge istatistikleri.
