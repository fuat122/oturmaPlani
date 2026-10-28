# Product Requirements Document (PRD)
## Smart Classroom Seating (Akıllı Sınıf Oturma Planı)
**Kurum:** ALKEV Özel Okulları  
**Depo (Repository):** `oturmaPlani`  
**Sürüm:** 1.2.0  
**Hedef Kitle:** Sınıf Rehber Öğretmenleri, Branş Öğretmenleri, PDR Servisi ve Okul Yönetimi  

---

### 1. Amaç ve Vizyon
Smart Classroom Seating, ALKEV Okulları öğretmenlerinin sınıf oturma planlarını pedagojik kriterler (görme/işitme özel gereksinimleri, kız-erkek dengesi, davranışsal uyarılar ve akran desteği) doğrultusunda adil, hızlı ve hatasız bir biçimde düzenlemesini sağlayan web tabanlı bir platformdur.

Uygulama, `oturmaPlani` GitHub Pages deposu üzerinde (`/oturmaPlani/` base yoluyla) canlı yayına alınmak üzere yapılandırılmıştır. Matbaa kalitesinde A4 Yatay PDF çıktısı üreterek sınıf kapılarına, öğretmen kürsülerine ve idari onay dosyalarına doğrudan basılabilir resmi doküman hazırlar.

---

### 2. Temel Fonksiyonel Gereksinimler

#### 2.1. Altyapı ve Dağıtım
- **Base Yolu:** `vite.config.js` ve `vite.config.ts` dosyalarında `base: '/oturmaPlani/'` olarak tanımlanır.
- **Scripts:** `package.json` içerisinde şu betikler eksiksiz yer alır:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
  ```
- **gh-pages:** Projenin bağımlılık listesinde yer alarak GitHub Pages dağıtımını otomatikleştirir.

#### 2.2. Kesintisiz Domain Güvenliği (@alkev.k12.tr)
- **Proje:** `oturma-plani-4448d` Firebase projesi.
- **Kural:** Sistem yalnızca `@alkev.k12.tr` uzantılı kurumsal Google Workspace hesaplarına izin verir.
- **Doğrulama Noktaları:** Hem `signInWithPopup` tamamlandığında hem de Firebase `onAuthStateChanged` tetiklendiğinde e-posta adresi denetlenir.
- **İhlal Eylemi:** Kurum dışı e-postalar derhal `await auth.signOut()` ile sistemden atılır, oturum açma arayüzünde tutulur ve açıklayıcı hata mesajı gösterilir.
- **Durum Güvencesi:** Giriş sürecinde ekran donmasını engellemek için `loading` durumu her senaryoda (`try`, `catch`, `finally`) kesin olarak `false` yapılır.
- **Arayüz Bildirimi:** Giriş butonunun altında *"ℹ️ Yalnızca @alkev.k12.tr uzantılı kurumsal e-posta adresleri kabul edilmektedir."* uyarısı yer alır.
- **Geliştirici/Önizleme Modu:** Yetkili geliştirme ortamları için test öğretmeni girişi (`ogretmen@alkev.k12.tr`) sunulur.

#### 2.3. Kurumsal Logo & Kimlik
- **Resmi ALKEV Logosu:** `/public/assets/aistudio/alkev-logo-tr-2025_552f0d5d.png` dosyasındaki resmi ALKEV Özel Okulları amblemi ve tipografisi Navbar'da, Giriş ekranında ve A4 PDF belgesinde kullanılmaktadır.

#### 2.4. Sınıf Sahipliği ve Rol Tabanlı Yetkilendirme (RBAC)
- **Sınıf Sahibi / Danışman:** Bir öğretmen yalnızca kendisinin oluşturduğu sınıflar üzerinde tam yetkilidir. Koltuk takası (tıkla-değiştir), öğrenci ekleme/çıkarma/düzenleme, ders içi bireysel yorumlar, sınıf genel notu ve A4 Yatay PDF indirme yetkisine sahiptir.
- **Branş Öğretmeni (Salt Okunur):** Öğretmenin kendisi oluşturmadığı sınıflar (veya henüz sınıf oluşturmadıysa tüm sınıflar) salt okunur modda açılır. Sıra yer değişikliği yapamaz, öğrenci ekleyip çıkaramaz, yorum yazamaz ve PDF indiremez.
- **Kendi Sınıfını Oluşturma:** Öğretmen üst menüdeki "+ Yeni Sınıf" butonuyla dilediği zaman kendi sınıfını oluşturabilir; oluşturduğu sınıfa anında düzenleme yetkisi tanımlanır.

#### 2.5. Öğrenci Cinsiyet Yönetimi & Pastel Sıra Renkleri
- **İfade Standardı:** Cinsiyet alanlarında yalnızca "Kız" ve "Erkek" yazılır; "öğrenci" kelimesi eklenmez.
- **Kız Öğrenciler:** Açık pastel pembe zemin (`#FDF2F8`, kenarlık `#FBCFE8`, metin `#831843`) ile gösterilir.
- **Erkek Öğrenciler:** Açık pastel mavi zemin (`#EFF6FF`, kenarlık `#BFDBFE`, metin `#1E3A8A`) ile gösterilir.
- **Toplu Listede Cinsiyet Ayıklama:** Listeye `101 - Ahmet Yılmaz - Erkek` veya `13 DOVLETALİ AMANOV Erkek` yazıldığında cinsiyet bilgisi akıllıca algılanır ve öğrencinin adına karışması engellenir.
- **PDF İsim Alanı Optimizasyonu:** PDF çıktısında isimlerin kutucuktan taşmaması için koltuk içi "Kız"/"Erkek" metni gizlenir (zemin rengi cinsiyeti belirtir), alan bütünüyle öğrenci numarası ve ad-soyadına ayrılır.

#### 2.6. Başarı Düzeyi Etiketlemesinin Kaldırılması
- Pedagojik ilkelere uygun olarak öğrencilerin başarı düzeyleri (ileri/orta/destek) arayüzden ve etiketlerden tamamen kaldırılmıştır. Öğretmenler öğrencilerin gelişimini doğrudan ders içi gözlem ve yorum sistemiyle takip eder.

#### 2.7. Ders İçi Bireysel & Sınıf Genel Yorumları
- **Bireysel Yorum:** Sınıf öğretmeni sıradaki her öğrenciye ders içi anlık gözlem notu, katılım takdiri veya rehberlik kaydı düşebilir.
- **Sınıf Genel Notu:** Sınıfı oluşturan öğretmen, üst bardaki "Sınıf Notu" butonuyla tüm ders veya etkinlik için toplu not alabilir.
- **Öğrenci Yorum Raporu:** "Yorum Raporu Al" butonuyla tüm öğrenci notları filtrelenebilir (kategoriye veya öğrenciye göre) ve yazdırılabilir / PDF yapılabilir.

#### 2.8. Sıfır Çökme Garantili ve OKLCH-Korumalı PDF Motoru
- **Sorun:** Modern Tailwind v4 stil sayfalarında bulunan `oklch()` renk fonksiyonları `html2canvas` motorunu çökertmektedir (`Attempting to parse an unsupported color function "oklch"`).
- **Çözüm:** PDF motoru izole bir `<iframe>` (sandbox) içerisinde yalnızca standart HEX renk kodları (`#FFFFFF`, `#FDF2F8`, `#EFF6FF`, `#1E3A8A`) ve gömülü stiller kullanarak çalışır. Belge stili dışındaki CSS değişkenlerinden tamamen yalıtılmıştır.
- **Format:** `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı Oturma Planı` başlığıyla, A4 Yatay, 2x retina netliğinde resmi kroki oluşturulur.

---

### 3. Kullanıcı Akışları
1. **Giriş:** Öğretmen `@alkev.k12.tr` Google Workspace hesabıyla giriş yapar.
2. **Rol & Sınıf Seçimi:** Üst bardan sınıfı seçer; yetkisine göre Rehber Öğretmen veya Branş Öğretmeni modunu görüntüler.
3. **Kadro Oluşturma:** Sınıf modalında veya öğrenci panelinde "Okul No - Ad Soyad - Cinsiyet" formatında tekli veya toplu kayıt yapılır.
4. **Oturma Planlama:** Sınıf öğretmeni "Akıllı Yerleştir" ile kız-erkek dengesini ve ön sıra ihtiyaçlarını otomatik optimize eder veya el ile koltukları takas eder.
5. **Ders İçi Takip:** Sıradaki öğrenciye tıklanarak not yazılır, "Sınıf Notu" ile genel ders kaydı alınır.
6. **Raporlama & Belge:** "Yorum Raporu" ile not dökümü alınır; sınıf öğretmeni "PDF İndir" ile A4 Yatay çıktıyı hazırlar.
