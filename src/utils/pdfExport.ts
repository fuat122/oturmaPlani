import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Classroom, Student } from '../types';

export interface PDFExportOptions {
  classroom: Classroom;
}

/**
 * Loads an image URL and converts it to a base64 DataURL for guaranteed offline & cross-origin rendering
 */
const toBase64Image = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas export warning:', e);
      }
      resolve(src);
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

/**
 * Sıfır Çökme Garantili ve OKLCH Hatasından İzole Edilmiş PDF Motoru:
 * 1. Tailwind v4'ün 'oklch' renk fonksiyonu html2canvas tarafından desteklenmediğinden,
 *    tamamen izole bir <iframe> içerisinde standart HEX renkli inline stillerle render edilir.
 * 2. Kız öğrenciler pastel pembe (#FDF2F8, sınır: #FBCFE8), erkek öğrenciler pastel mavi (#EFF6FF, sınır: #BFDBFE).
 * 3. Başlık formatı: "[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı".
 * 4. Öğrencilerin başarı düzeyi kaldırılmıştır.
 * 5. ALKEV logosu base64 olarak eklenir.
 * 6. finally bloğunda iframe kesin olarak temizlenir.
 */
export const exportClassroomSeatingPDF = async ({
  classroom
}: PDFExportOptions): Promise<void> => {
  let iframe: HTMLIFrameElement | null = null;

  try {
    const studentMap = new Map<string, Student>(classroom.students.map((s) => [s.id, s]));
    const formattedDate = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // ALKEV Logo URL
    const logoUrl = `${import.meta.env.BASE_URL || '/'}assets/aistudio/alkev-logo-tr-2025_552f0d5d.png`;
    const logoBase64 = await toBase64Image(logoUrl);

    // Sıraları matris olarak düzenle
    const rows = classroom.rowsCount || 4;
    const cols = classroom.columnsCount || 3;

    const deskGrid: { [key: string]: any } = {};
    classroom.desks.forEach((desk) => {
      deskGrid[`${desk.row}-${desk.column}`] = desk;
    });

    // İstatistikler: Sınıf genelindeki gerçek cinsiyet dağılımı
    let totalSeated = 0;
    let frontNeedsMet = 0;
    let frontNeedsTotal = 0;
    const femaleCount = classroom.students.filter((s) => s.gender === 'female').length;
    const maleCount = classroom.students.filter((s) => s.gender === 'male').length;

    classroom.students.forEach((s) => {
      if (s.specialNeeds?.frontRowRequired) frontNeedsTotal++;
    });

    classroom.desks.forEach((desk) => {
      const left = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
      const right = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;
      if (left) {
        totalSeated++;
        if (desk.row === 1 && left.specialNeeds?.frontRowRequired) frontNeedsMet++;
      }
      if (right) {
        totalSeated++;
        if (desk.row === 1 && right.specialNeeds?.frontRowRequired) frontNeedsMet++;
      }
    });



    // İzole iframe oluşturarak Tailwind v4 'oklch' stillerinden %100 arındırıyoruz
    iframe = document.createElement('iframe');
    iframe.id = 'alkev-pdf-isolated-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1180px';
    iframe.style.height = '900px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('İzole render alanı oluşturulamadı.');
    }

    // HTML Şablonunu İnşa Et (Tamamı Saf HEX Renkler, 1120px Sabit Genişlikli A4 Yatay İskeleti)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background-color: #FFFFFF;
              color: #0F172A;
              padding: 10px;
              width: 1120px;
              max-width: 100%;
              box-sizing: border-box;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; border: 2px solid #1E3A8A; border-radius: 10px; padding: 12px; background-color: #FFFFFF;">
            
            <!-- Kurumsal Üst Başlık & Logo -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${logoBase64}" alt="ALKEV Logo" style="height: 44px; width: auto; object-fit: contain;" />
                <div>
                  <div style="color: #1E3A8A; font-size: 16px; font-weight: 800; letter-spacing: -0.5px;">ALKEV ÖZEL OKULLARI</div>
                  <div style="color: #475569; font-size: 11px; font-weight: 600;">Akıllı Sınıf Oturma Düzeni Planı</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block;">
                  ${classroom.academicYear || '2026-2027'} Eğitim-Öğretim Yılı
                </div>
                <div style="color: #64748B; font-size: 10px; margin-top: 3px;">Rapor Tarihi: ${formattedDate}</div>
              </div>
            </div>

            <!-- Başlık: [Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı -->
            <div style="text-align: center; margin-bottom: 12px; width: 100%;">
              <h1 style="color: #0F172A; font-size: 19px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                ${classroom.advisoryTeacher || 'Danışman Öğretmen'} Danışmanlığında ${classroom.name || 'Sınıf'} Sınıfı
              </h1>
              <p style="color: #475569; font-size: 11px; margin: 2px 0 0 0;">
                Oturma Planı ve Öğrenci Yerleşim Krokisi
              </p>
            </div>

            <!-- Akıllı Tahta & Öğretmen Kürsüsü Bölgesi -->
            <div style="width: 100%; box-sizing: border-box; background-color: #0F172A; color: #FFFFFF; border-radius: 8px; padding: 7px 16px; text-align: center; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">[ KAPI TARAFI ]</div>
              <div style="font-size: 11.5px; font-weight: 700; letter-spacing: 1px;">
                ✦ ÖĞRETMEN KÜRSÜSÜ & AKILLI TAHTA (ÖN CEPHE) ✦
              </div>
              <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">[ PENCERE TARAFI ]</div>
            </div>

            <!-- Sınıf Sıraları Grid'i (100% Bounded, Sağa Kesinlikle Taşmaz) -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; overflow: hidden;">
              ${Array.from({ length: rows })
                .map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  return `
                  <div style="display: flex; gap: 8px; align-items: stretch; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden;">
                    <!-- Satır Numarası Etiketi -->
                    <div style="width: 50px; min-width: 50px; max-width: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 9pt; font-weight: normal; color: #334155; box-sizing: border-box; margin: 0; padding: 2px;">
                      ${rowNum}. Sıra
                    </div>

                    <!-- Bloklar Grid'i (minmax(0, 1fr) ile eşit sütunlar, taşma yapmaz) -->
                    <div style="flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 8px; width: 100%; box-sizing: border-box; overflow: hidden;">
                      ${Array.from({ length: cols })
                        .map((_, cIdx) => {
                          const colNum = cIdx + 1;
                          const desk = deskGrid[`${rowNum}-${colNum}`];
                          const left = desk?.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
                          const right = desk?.rightStudentId ? studentMap.get(desk.rightStudentId) : null;

                          const renderStudentSeat = (student: Student | null | undefined) => {
                            if (!student) {
                              return `
                                <div style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 5px; padding: 2px 4px; margin: 0; height: auto; min-height: 44px; max-height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94A3B8; font-size: 8.5pt; font-style: italic; box-sizing: border-box; min-width: 0; overflow: visible;">
                                  Boş
                                </div>
                              `;
                            }

                            const isFemale = student.gender === 'female';
                            // Kız: Pastel Pembe (#FDF2F8 / #FBCFE8)
                            // Erkek: Pastel Mavi (#EFF6FF / #BFDBFE)
                            const bgColor = isFemale ? '#FDF2F8' : '#EFF6FF';
                            const borderColor = isFemale ? '#FBCFE8' : '#BFDBFE';

                            return `
                              <div style="background-color: ${bgColor}; border: 1.5px solid ${borderColor}; border-radius: 5px; padding: 2px 4px; margin: 0; height: auto; min-height: 44px; max-height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; min-width: 0; overflow: visible;">
                                <span style="font-size: 8.5pt; font-weight: normal; color: #0F172A; line-height: 1.1; word-break: break-word; overflow: visible; width: 100%; box-sizing: border-box; text-align: center; margin: 0; padding: 0;">
                                  ${student.name}
                                </span>
                              </div>
                            `;
                          };

                          return `
                          <div style="background-color: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 3px; margin: 0; box-sizing: border-box; min-width: 0; overflow: hidden; display: flex; align-items: stretch;">
                            <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px; width: 100%; margin: 0; box-sizing: border-box;">
                              ${renderStudentSeat(left)}
                              ${renderStudentSeat(right)}
                            </div>
                          </div>
                        `;
                        })
                        .join('')}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>

            <!-- İstatistik ve İmza Bölümü -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E2E8F0; padding-top: 12px; margin-top: 12px; width: 100%; box-sizing: border-box;">
              <div style="display: flex; gap: 16px; font-size: 11.5px; color: #334155;">
                <div>
                  <span style="color: #64748B;">Mevcut / Yerleşen:</span>
                  <strong style="color: #0F172A; margin-left: 4px;">${totalSeated} / ${classroom.students.length}</strong>
                </div>
                <div>
                  <span style="color: #64748B;">Cinsiyet Dağılımı:</span>
                  <strong style="color: #BE185D; margin-left: 4px;">${femaleCount} Kız</strong>,
                  <strong style="color: #1D4ED8; margin-left: 2px;">${maleCount} Erkek</strong>
                </div>
                <div>
                  <span style="color: #64748B;">Ön Sıra Durumu:</span>
                  <strong style="color: ${frontNeedsMet === frontNeedsTotal ? '#059669' : '#D97706'}; margin-left: 4px;">
                    ${frontNeedsMet}/${frontNeedsTotal} Yerleşti
                  </strong>
                </div>
              </div>

              <!-- İmza Alanları -->
              <div style="display: flex; gap: 32px; text-align: center;">
                <div style="width: 150px;">
                  <div style="font-size: 11.5px; font-weight: 700; color: #0F172A;">${classroom.advisoryTeacher || 'Danışman Öğretmen'}</div>
                  <div style="font-size: 10.5px; color: #64748B;">Sınıf Rehber Öğretmeni</div>
                  <div style="border-bottom: 1px dashed #94A3B8; height: 28px; margin-top: 3px;"></div>
                </div>
                <div style="width: 150px;">
                  <div style="font-size: 11.5px; font-weight: 700; color: #0F172A;">Okul Yönetimi</div>
                  <div style="font-size: 10.5px; color: #64748B;">Onay / Mühür</div>
                  <div style="border-bottom: 1px dashed #94A3B8; height: 28px; margin-top: 3px;"></div>
                </div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Render süresini garanti et
    await new Promise((r) => setTimeout(r, 140));

    // html2canvas ile izole DOM'u çek (oklch içeren stiller bu iframe'de bulunmaz)
    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      width: 1120,
      windowWidth: 1120
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // jsPDF: A4 Yatay (Landscape 297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm
    const margin = 8;
    const printableWidth = pdfWidth - margin * 2;
    const printableHeight = pdfHeight - margin * 2;

    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    let renderWidth = printableWidth;
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > printableHeight) {
      renderHeight = printableHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const posX = (pdfWidth - renderWidth) / 2;
    const posY = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);

    const safeClassroomName = (classroom.name || 'Sinif').replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`ALKEV_${safeClassroomName}_Oturma_Plani.pdf`);
  } catch (error) {
    console.error('PDF oluşturulurken hata meydana geldi:', error);
    throw error;
  } finally {
    // İzole iframe'i DOM'dan sil
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
};
