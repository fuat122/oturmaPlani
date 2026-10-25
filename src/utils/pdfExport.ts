import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Classroom, Student } from '../types';

export interface PDFExportOptions {
  classroom: Classroom;
}

/**
 * Sıfır Çökme Garantili ve Ekran Bağımsız PDF Motoru:
 * 1. DOM dışında (off-screen, left: -9999px) 1200px sabit genişlikli bir şablon oluşturur.
 * 2. Standart HEX renkleri inline CSS ile uygular.
 * 3. "[Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı" başlığını kullanır.
 * 4. html2canvas ve jsPDF ile A4 Yatay çıktı üretir.
 * 5. finally bloğunda geçici şablonu DOM'dan kesin olarak temizler.
 */
export const exportClassroomSeatingPDF = async ({
  classroom
}: PDFExportOptions): Promise<void> => {
  let offScreenContainer: HTMLDivElement | null = null;

  try {
    const studentMap = new Map<string, Student>(classroom.students.map(s => [s.id, s]));
    const formattedDate = new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1200px sabit genişlikli ekran dışı container oluştur
    offScreenContainer = document.createElement('div');
    offScreenContainer.id = 'alkev-pdf-export-offscreen';
    offScreenContainer.style.position = 'fixed';
    offScreenContainer.style.left = '-9999px';
    offScreenContainer.style.top = '0';
    offScreenContainer.style.width = '1200px';
    offScreenContainer.style.backgroundColor = '#FFFFFF';
    offScreenContainer.style.color = '#0F172A';
    offScreenContainer.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    offScreenContainer.style.padding = '32px 40px';
    offScreenContainer.style.boxSizing = 'border-box';
    offScreenContainer.style.zIndex = '-9999';

    // Sıraları matris olarak düzenle
    const rows = classroom.rowsCount || 4;
    const cols = classroom.columnsCount || 3;

    // Masaları satır ve sütunlara göre haritalandır
    const deskGrid: { [key: string]: any } = {};
    classroom.desks.forEach(desk => {
      deskGrid[`${desk.row}-${desk.column}`] = desk;
    });

    // İstatistikler
    let totalSeated = 0;
    let frontNeedsMet = 0;
    let frontNeedsTotal = 0;
    let femaleCount = 0;
    let maleCount = 0;

    classroom.students.forEach(s => {
      if (s.specialNeeds.frontRowRequired) frontNeedsTotal++;
    });

    classroom.desks.forEach(desk => {
      const left = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
      const right = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;
      if (left) {
        totalSeated++;
        if (left.gender === 'female') femaleCount++; else maleCount++;
        if (desk.row === 1 && left.specialNeeds.frontRowRequired) frontNeedsMet++;
      }
      if (right) {
        totalSeated++;
        if (right.gender === 'female') femaleCount++; else maleCount++;
        if (desk.row === 1 && right.specialNeeds.frontRowRequired) frontNeedsMet++;
      }
    });

    // HTML Şablonunu İnşa Et (100% Inline HEX Renkler)
    offScreenContainer.innerHTML = `
      <div style="border: 2px solid #1E3A8A; border-radius: 12px; padding: 24px; background: #FFFFFF;">
        <!-- Kurumsal Üst Başlık -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <div style="color: #1E3A8A; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ALKEV ÖZEL OKULLARI</div>
            <div style="color: #475569; font-size: 13px; font-weight: 500; margin-top: 2px;">Akıllı Sınıf Oturma Düzeni & Pedagojik Dağılım Çizelgesi</div>
          </div>
          <div style="text-align: right;">
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block;">
              ${classroom.academicYear || '2025-2026'} Eğitim-Öğretim Yılı
            </div>
            <div style="color: #64748B; font-size: 11px; margin-top: 4px;">Rapor Tarihi: ${formattedDate}</div>
          </div>
        </div>

        <!-- İstenen Kesin Başlık: [Danışman Öğretmen] Danışmanlığında [Sınıf Adı] Sınıfı -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
            ${classroom.advisoryTeacher || 'Danışman Öğretmen'} Danışmanlığında ${classroom.name || 'Sınıf'} Sınıfı
          </h1>
          <p style="color: #475569; font-size: 13px; margin: 6px 0 0 0;">
            Oturma Planı ve Öğrenci Yerleşim Krokisi
          </p>
        </div>

        <!-- Akıllı Tahta & Öğretmen Kürsüsü Bölgesi -->
        <div style="background: #0F172A; color: #FFFFFF; border-radius: 8px; padding: 10px 24px; text-align: center; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">[ KAPI TARAFI ]</div>
          <div style="font-size: 14px; font-weight: 700; letter-spacing: 1px;">
            ✦ ÖĞRETMEN KÜRSÜSÜ & AKILLI TAHTA (ÖN CEPHE) ✦
          </div>
          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">[ PENCERE TARAFI ]</div>
        </div>

        <!-- Sınıf Sıraları Grid'i -->
        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
          ${Array.from({ length: rows })
            .map((_, rIdx) => {
              const rowNum = rIdx + 1;
              return `
              <div style="display: flex; gap: 20px; align-items: stretch;">
                <div style="width: 70px; display: flex; align-items: center; justify-content: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 12px; font-weight: 700; color: #334155;">
                  ${rowNum}. Sıra
                </div>
                <div style="flex: 1; display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 20px;">
                  ${Array.from({ length: cols })
                    .map((_, cIdx) => {
                      const colNum = cIdx + 1;
                      const desk = deskGrid[`${rowNum}-${colNum}`];
                      const left = desk?.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
                      const right = desk?.rightStudentId ? studentMap.get(desk.rightStudentId) : null;

                      const colTitle = colNum === 1 ? 'Sol Blok' : colNum === 2 ? 'Orta Blok' : 'Sağ Blok';

                      return `
                      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size: 10px; font-weight: 600; color: #64748B; text-align: center; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${colTitle}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                          <!-- Sol Koltuk -->
                          <div style="background: ${left ? '#FFFFFF' : '#F1F5F9'}; border: 1px solid ${left ? '#94A3B8' : '#E2E8F0'}; border-radius: 6px; padding: 8px 6px; min-height: 58px; display: flex; flex-direction: column; justify-content: center;">
                            ${
                              left
                                ? `
                              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                                <span style="font-size: 10px; font-weight: 700; color: #1E3A8A;">#${left.number}</span>
                                <span style="font-size: 9px; font-weight: 600; color: ${left.gender === 'female' ? '#7C3AED' : '#0284C7'};">
                                  ${left.gender === 'female' ? 'Kız' : 'Erkek'}
                                </span>
                              </div>
                              <div style="font-size: 12px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${left.name}
                              </div>
                              ${
                                left.specialNeeds.frontRowRequired
                                  ? '<div style="font-size: 9px; color: #D97706; font-weight: 600; margin-top: 2px;">★ Ön Sıra İhtiyacı</div>'
                                  : ''
                              }
                            `
                                : '<div style="color: #94A3B8; font-size: 11px; text-align: center; font-style: italic;">Boş</div>'
                            }
                          </div>

                          <!-- Sağ Koltuk -->
                          <div style="background: ${right ? '#FFFFFF' : '#F1F5F9'}; border: 1px solid ${right ? '#94A3B8' : '#E2E8F0'}; border-radius: 6px; padding: 8px 6px; min-height: 58px; display: flex; flex-direction: column; justify-content: center;">
                            ${
                              right
                                ? `
                              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                                <span style="font-size: 10px; font-weight: 700; color: #1E3A8A;">#${right.number}</span>
                                <span style="font-size: 9px; font-weight: 600; color: ${right.gender === 'female' ? '#7C3AED' : '#0284C7'};">
                                  ${right.gender === 'female' ? 'Kız' : 'Erkek'}
                                </span>
                              </div>
                              <div style="font-size: 12px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${right.name}
                              </div>
                              ${
                                right.specialNeeds.frontRowRequired
                                  ? '<div style="font-size: 9px; color: #D97706; font-weight: 600; margin-top: 2px;">★ Ön Sıra İhtiyacı</div>'
                                  : ''
                              }
                            `
                                : '<div style="color: #94A3B8; font-size: 11px; text-align: center; font-style: italic;">Boş</div>'
                            }
                          </div>
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
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E2E8F0; padding-top: 16px; margin-top: 16px;">
          <!-- Dağılım Özeti -->
          <div style="display: flex; gap: 24px; font-size: 12px; color: #334155;">
            <div>
              <span style="color: #64748B;">Mevcut / Yerleşen:</span>
              <strong style="color: #0F172A; margin-left: 4px;">${totalSeated} / ${classroom.students.length}</strong>
            </div>
            <div>
              <span style="color: #64748B;">Cinsiyet Dağılımı:</span>
              <strong style="color: #0F172A; margin-left: 4px;">${femaleCount} Kız, ${maleCount} Erkek</strong>
            </div>
            <div>
              <span style="color: #64748B;">Ön Sıra Gereksinimi:</span>
              <strong style="color: ${frontNeedsMet === frontNeedsTotal ? '#059669' : '#D97706'}; margin-left: 4px;">
                ${frontNeedsMet}/${frontNeedsTotal} Yerleşti
              </strong>
            </div>
          </div>

          <!-- İmza Alanları -->
          <div style="display: flex; gap: 48px; text-align: center;">
            <div style="width: 170px;">
              <div style="font-size: 12px; font-weight: 700; color: #0F172A;">${classroom.advisoryTeacher || 'Danışman Öğretmen'}</div>
              <div style="font-size: 11px; color: #64748B;">Sınıf Rehber Öğretmeni</div>
              <div style="border-bottom: 1px dashed #94A3B8; height: 35px; margin-top: 6px;"></div>
            </div>
            <div style="width: 170px;">
              <div style="font-size: 12px; font-weight: 700; color: #0F172A;">Okul Yönetimi</div>
              <div style="font-size: 11px; color: #64748B;">Onay / Mühür</div>
              <div style="border-bottom: 1px dashed #94A3B8; height: 35px; margin-top: 6px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(offScreenContainer);

    // html2canvas ile yüksek çözünürlüklü capture
    const canvas = await html2canvas(offScreenContainer, {
      scale: 2, // 2x retina netliği
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

    // Kenar boşluğu (margin) 8mm
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
    // Şablonu kesin olarak DOM'dan kaldır
    if (offScreenContainer && offScreenContainer.parentNode) {
      offScreenContainer.parentNode.removeChild(offScreenContainer);
    }
  }
};
