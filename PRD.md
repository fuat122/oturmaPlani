# Product Requirements Document (PRD)
## Smart Classroom Seating (Akıllı Sınıf Oturma Planı)
**Kurum:** ALKEV Özel Okulları  
**Depo (Repository):** `oturmaPlani`  
**Sürüm:** 1.0.0  
**Hedef Kitle:** Sınıf Rehber Öğretmenleri, Branş Öğretmenleri, PDR Servisi ve Okul Yönetimi  

---

### 1. Amaç ve Vizyon
Smart Classroom Seating, ALKEV Okulları öğretmenlerinin sınıf oturma planlarını pedagojik kriterler (görme/işitme özel gereksinimleri, kız-erkek dengesi, akademik seviye karması ve davranışsal uyarılar) doğrultusunda adil, hızlı ve hatasız bir biçimde düzenlemesini sağlayan web tabanlı bir platformdur.

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

#### 2.3. Mobil Responsive Arayüz (Tailwind CSS)
- **Esnek Navbar:** Mobil ekranlarda dikey (`flex-col`), masaüstü ekranlarda yatay (`sm:flex-row`) düzende çalışır. Logo, sınıf seçici ve kullanıcı profili asla dikey taşma veya ekran dışına çıkma yapmaz.
- **Öğrenci Takip & Gözlem Paneli:** Modal içi kaydırma alanına alt kısımda esnek padding (`pb-28`) eklenmiştir. Listenin en altındaki öğrenciler ekran altında kesilmez, rahatça kaydırılır.

#### 2.4. Sıfır Çökme Garantili PDF Motoru
- **Ekran Bağımsız Render:** Ekrandaki responsive DOM'u doğrudan resme dönüştürmek yerine, buton tetiklendiğinde DOM dışında (off-screen, `left: -9999px`) 1200px sabit genişlikte, standart HEX renkler kullanan A4 Yatay şablon oluşturulur.
- **Zorunlu Başlık Formatı:** `[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı`.
- **Dönüştürme ve İndirme:** `html2canvas` ve `jsPDF` kütüphaneleriyle 2x retina netliğinde A4 yatay PDF üretilir ve indirilir.
- **Temizlik Garantisi:** `finally` bloğu içerisinde geçici DOM şablonu silinir.

#### 2.5. Akıllı Oturma Motoru (Multi-Criteria Optimization)
- **Ön Sıra Gereksinimi:** Görme veya işitme gereksinimi olan öğrenciler öncelikle 1. sıraya yerleştirilir.
- **Davranışsal Ayrıştırma:** Birbirleriyle konuşan veya ders düzenini bozan öğrenciler (avoid list) aynı sıraya veya komşu sıralara verilmez.
- **Cinsiyet ve Akademik Denge:** Çiftli sıralarda kız-erkek dengesi ile akran öğrenmesini destekleyecek akademik seviye dağılımı sağlanır.

---

### 3. Kullanıcı Akışları
1. **Giriş:** Öğretmen ALKEV kurumsal e-postasıyla giriş yapar.
2. **Sınıf Yönetimi:** Açılır menüden sınıfını seçer veya yeni sınıf oluşturur.
3. **Öğrenci Bilgileri:** Gözlem panelinden öğrenci notlarını, ön sıra gereksinimlerini ve kaçınma kurallarını düzenler.
4. **Oturma Planlama:** Tek tıkla "Akıllı Yerleştir" çalıştırılır veya sıralar el ile tıklanarak değiştirilir (click-to-swap).
5. **Raporlama:** "PDF İndir" ile resmi A4 yatay krokisi tek tıkla alınır.
