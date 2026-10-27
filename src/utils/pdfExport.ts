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

    // İstatistikler
    let totalSeated = 0;
    let frontNeedsMet = 0;
    let frontNeedsTotal = 0;
    let femaleCount = 0;
    let maleCount = 0;

    classroom.students.forEach((s) => {
      if (s.specialNeeds?.frontRowRequired) frontNeedsTotal++;
    });

    classroom.desks.forEach((desk) => {
      const left = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
      const right = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;
      if (left) {
        totalSeated++;
        if (left.gender === 'female') femaleCount++;
        else maleCount++;
        if (desk.row === 1 && left.specialNeeds?.frontRowRequired) frontNeedsMet++;
      }
      if (right) {
        totalSeated++;
        if (right.gender === 'female') femaleCount++;
        else maleCount++;
        if (desk.row === 1 && right.specialNeeds?.frontRowRequired) frontNeedsMet++;
      }
    });

    // İzole iframe oluşturarak Tailwind v4 'oklch' stillerinden %100 arındırıyoruz
    iframe = document.createElement('iframe');
    iframe.id = 'alkev-pdf-isolated-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1250px';
    iframe.style.height = '950px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('İzole render alanı oluşturulamadı.');
    }

    // HTML Şablonunu İnşa Et (Tamamı Saf HEX Renkler)
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
              padding: 24px;
              width: 1200px;
            }
          </style>
        </head>
        <body>
          <div style="border: 2px solid #1E3A8A; border-radius: 12px; padding: 24px; background-color: #FFFFFF;">
            
            <!-- Kurumsal Üst Başlık & Logo -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 18px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${logoBase64}" alt="ALKEV Logo" style="height: 52px; width: auto; object-fit: contain;" />
                <div>
                  <div style="color: #1E3A8A; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">ALKEV ÖZEL OKULLARI</div>
                  <div style="color: #475569; font-size: 12px; font-weight: 600;">Akıllı Sınıf Oturma Düzeni Planı</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;">
                  ${classroom.academicYear || '2025-2026'} Eğitim-Öğretim Yılı
                </div>
                <div style="color: #64748B; font-size: 11px; margin-top: 4px;">Rapor Tarihi: ${formattedDate}</div>
              </div>
            </div>

            <!-- Başlık: [Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı -->
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                ${classroom.advisoryTeacher || 'Danışman Öğretmen'} Danışmanlığında ${classroom.name || 'Sınıf'} Sınıfı
              </h1>
              <p style="color: #475569; font-size: 12px; margin: 4px 0 0 0;">
                Oturma Planı ve Öğrenci Yerleşim Krokisi
              </p>
            </div>

            <!-- Akıllı Tahta & Öğretmen Kürsüsü Bölgesi -->
            <div style="background-color: #0F172A; color: #FFFFFF; border-radius: 8px; padding: 9px 24px; text-align: center; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">[ KAPI TARAFI ]</div>
              <div style="font-size: 13px; font-weight: 700; letter-spacing: 1px;">
                ✦ ÖĞRETMEN KÜRSÜSÜ & AKILLI TAHTA (ÖN CEPHE) ✦
              </div>
              <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">[ PENCERE TARAFI ]</div>
            </div>

            <!-- Sınıf Sıraları Grid'i -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
              ${Array.from({ length: rows })
                .map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  return `
                  <div style="display: flex; gap: 16px; align-items: stretch;">
                    <div style="width: 70px; display: flex; align-items: center; justify-content: center; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 12px; font-weight: 700; color: #334155;">
                      ${rowNum}. Sıra
                    </div>
                    <div style="flex: 1; display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px;">
                      ${Array.from({ length: cols })
                        .map((_, cIdx) => {
                          const colNum = cIdx + 1;
                          const desk = deskGrid[`${rowNum}-${colNum}`];
                          const left = desk?.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
                          const right = desk?.rightStudentId ? studentMap.get(desk.rightStudentId) : null;
                          const colTitle = colNum === 1 ? 'Sol Blok' : colNum === 2 ? 'Orta Blok' : 'Sağ Blok';

                          const renderStudentSeat = (student: Student | null | undefined) => {
                            if (!student) {
                              return `
                                <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 8px 6px; min-height: 54px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 11px; font-style: italic;">
                                  Boş
                                </div>
                              `;
                            }

                            const isFemale = student.gender === 'female';
                            // Kız: Pastel Açık Pembe (#FDF2F8 / #FBCFE8)
                            // Erkek: Pastel Açık Mavi (#EFF6FF / #BFDBFE)
                            const bgColor = isFemale ? '#FDF2F8' : '#EFF6FF';
                            const borderColor = isFemale ? '#FBCFE8' : '#BFDBFE';
                            const badgeColor = isFemale ? '#BE185D' : '#1D4ED8';

                            return `
                              <div style="background-color: ${bgColor}; border: 1.5px solid ${borderColor}; border-radius: 6px; padding: 7px 8px; min-height: 54px; display: flex; flex-direction: column; justify-content: center;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                                  <span style="font-size: 10px; font-weight: 800; color: #0F172A;">#${student.number}</span>
                                  <span style="font-size: 9px; font-weight: 700; color: ${badgeColor};">
                                    ${isFemale ? 'Kız' : 'Erkek'}
                                  </span>
                                </div>
                                <div style="font-size: 12px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                  ${student.name}
                                </div>
                                ${
                                  student.specialNeeds?.frontRowRequired
                                    ? '<div style="font-size: 9px; color: #D97706; font-weight: 700; margin-top: 1px;">★ Ön Sıra İhtiyacı</div>'
                                    : ''
                                }
                              </div>
                            `;
                          };

                          return `
                          <div style="background-color: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px;">
                            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-align: center; margin-bottom: 6px; text-transform: uppercase;">
                              ${colTitle}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
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
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E2E8F0; padding-top: 14px; margin-top: 14px;">
              <div style="display: flex; gap: 20px; font-size: 12px; color: #334155;">
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
              <div style="display: flex; gap: 40px; text-align: center;">
                <div style="width: 160px;">
                  <div style="font-size: 12px; font-weight: 700; color: #0F172A;">${classroom.advisoryTeacher || 'Danışman Öğretmen'}</div>
                  <div style="font-size: 11px; color: #64748B;">Sınıf Rehber Öğretmeni</div>
                  <div style="border-bottom: 1px dashed #94A3B8; height: 32px; margin-top: 4px;"></div>
                </div>
                <div style="width: 160px;">
                  <div style="font-size: 12px; font-weight: 700; color: #0F172A;">Okul Yönetimi</div>
                  <div style="font-size: 11px; color: #64748B;">Onay / Mühür</div>
                  <div style="border-bottom: 1px dashed #94A3B8; height: 32px; margin-top: 4px;"></div>
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

    // Kısa bir süre bekleyerek iframe render'ını garanti et
    await new Promise((r) => setTimeout(r, 120));

    // html2canvas ile izole DOM'u çek (oklch içeren harici stiller bu iframe'de bulunmaz)
    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      width: 1200,
      windowWidth: 1200
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // jsPDF: A4 Yatay (Landscape)
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
