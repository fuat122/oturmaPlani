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

2. **PDF Motoru Mimarisi**:
   - Asla ekrandaki responsive arayüzü doğrudan `html2canvas`'a vermeyiniz.
   - Her zaman ekran dışında (`left: -9999px`) 1200px sabit genişlikli, standart HEX renkler kullanan bağımsız bir şablon oluşturunuz.
   - Başlık kesinlikle `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı` formatında olmalıdır.
   - DOM temizliğini daima `finally` bloğunda yapınız (`offScreenContainer.parentNode.removeChild(offScreenContainer)`).

3. **Mobil Uyumluluk & Padding**:
   - Navbar bileşeni dikey/esnek düzende (`flex-col sm:flex-row`) kalmalıdır.
   - Öğrenci Takip & Gözlem Paneli içindeki kaydırılabilir alanda `pb-28` padding değeri korunmalıdır.

4. **GitHub Pages Dağıtımı & Vite Yapılandırması**:
   - `vite.config.ts`: `base: command === 'serve' ? '/' : '/oturma_plani/'` kuralına sadık kalmalıdır.
   - `package.json` içindeki `"predeploy": "npm run build"` ve `"deploy": "gh-pages -d dist"` scriptleri silinmemelidir.

---

### 2. Dosya Organizasyonu ve Sorumluluklar
- `src/context/AuthContext.tsx`: Firebase kimlik doğrulama, domain filtreleme ve test oturumu.
- `src/lib/firebase.ts`: Firebase istemci başlatma ve `isAlkevEmail` fonksiyonu.
- `src/utils/pdfExport.ts`: Ekran dışı A4 Yatay PDF üretim motoru.
- `src/utils/seatingAlgorithm.ts`: Çok kriterli akıllı oturma ve pedagojik denge algoritması.
- `src/components/Navbar.tsx`: Mobil duyarlı kurumsal üst bar.
- `src/components/ClassroomGrid.tsx`: İnteraktif çiftli sıra matrisi ve koltuk takası.
- `src/components/StudentObservationModal.tsx`: Öğrenci profilleri, özel ihtiyaçlar ve gözlem notları.
- `src/components/ClassroomToolbar.tsx`: Aksiyon butonları ve denge istatistikleri.
