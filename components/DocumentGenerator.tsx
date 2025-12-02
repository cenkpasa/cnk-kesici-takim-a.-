
import React, { useState, useEffect, useRef } from 'react';
import { Personnel } from '../types';
import { documentTemplates } from './DocumentTemplates';

// Declare html2pdf globally if loaded via CDN
declare const html2pdf: any;

interface DocumentGeneratorProps {
    onClose: () => void;
    allPersonnel: Personnel[];
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ onClose, allPersonnel }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState(documentTemplates[0].id);
    const [selectedPersonnelId, setSelectedPersonnelId] = useState(allPersonnel[0]?.id || '');
    const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // Formatting state for toolbar
    const [fontFamily, setFontFamily] = useState("'Times New Roman', serif");
    const [fontSize, setFontSize] = useState("12px");
    const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
    const [lineHeight, setLineHeight] = useState("1.2");

    // Load html2pdf library dynamically if not present
    useEffect(() => {
        if (typeof html2pdf === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.async = true;
            document.body.appendChild(script);
            return () => {
                try { document.body.removeChild(script); } catch(e) {}
            }
        }
    }, []);

    useEffect(() => {
        setDynamicValues({});
    }, [selectedTemplateId, selectedPersonnelId]);

    const generateContent = () => {
        const template = documentTemplates.find(t => t.id === selectedTemplateId);
        const personnel = allPersonnel.find(p => p.id === selectedPersonnelId);

        if (!template || !personnel) return null;

        let content = template.content;
        const today = new Date().toLocaleDateString('tr-TR');

        // 1. COMPACT SIDE-BY-SIDE HEADER
        const COMPANY_HEADER_HTML = `
            <table style="width: 100%; border-bottom: 2px solid #ce1e1e; margin-bottom: 15px; font-family: 'Segoe UI', Tahoma, sans-serif;">
                <tr>
                    <td style="width: 80px; vertical-align: middle; padding-bottom: 5px;">
                         <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNjZTFlMWUiIHN0cm9rZS13aWR0aD0iNSI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIC8+CiAgPHRleHQgeD0iNTAiIHk9IjU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjMwIiBmaWxsPSIjY2UxZTFlIiBzdHJva2U9Im5vbmUiPkNOSzwvdGV4dD4KPC9zdmc+" style="height: 65px;" alt="CNK Logo" />
                    </td>
                    <td style="vertical-align: middle; text-align: center; padding-bottom: 5px;">
                        <h2 style="margin: 0; color: #ce1e1e; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">CNK KESİCİ TAKIMLAR ENDÜSTRİ TEKNİK HIRD. SAN TİC. A.Ş</h2>
                        <div style="margin-top: 3px; font-size: 10px; color: #444; line-height: 1.2;">
                            İVEDİK OSB PROTED PARK İŞ MERKEZİ No:151 06378 YENİMAHALLE/ ANKARA<br/>
                            Tel: 0312 396 44 42 | Fax: 0312 396 44 41 | Web: www.cnkkesicitakim.com.tr<br/>
                            Vergi Dairesi: İVEDİK | VKN: 2111449380 | MERSİS: 0211144938000001
                        </div>
                    </td>
                </tr>
            </table>
        `;

        // 2. STANDARDIZED INFO BLOCK
        const INFO_BLOCK_HTML = `
            <div style="border: 1px solid #333; padding: 0; margin-bottom: 20px; font-family: 'Times New Roman', serif; font-size: 11px; text-align: left;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; border-right: 1px solid #333; padding: 8px;">
                            <h4 style="margin: 0 0 3px 0; text-decoration: underline; font-weight: bold;">İŞVEREN BİLGİLERİ:</h4>
                            <p style="margin: 1px 0;"><strong>Ünvan:</strong> CNK Kesici Takımlar San. ve Tic. Ltd. Şti.</p>
                            <p style="margin: 1px 0;"><strong>Adres:</strong> İvedik OSB Proted Park No:151 Yenimahalle/ANKARA</p>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding: 8px;">
                            <h4 style="margin: 0 0 3px 0; text-decoration: underline; font-weight: bold;">ÇALIŞAN BİLGİLERİ:</h4>
                            <p style="margin: 1px 0;"><strong>Ad Soyad:</strong> ${personnel.adSoyad}</p>
                            <p style="margin: 1px 0;"><strong>T.C. Kimlik No:</strong> ${personnel.id}</p>
                            <p style="margin: 1px 0;"><strong>Görevi:</strong> ${personnel.gorevi}</p>
                            <p style="margin: 1px 0;"><strong>Tarih:</strong> ${today}</p>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        // 3. FOOTER SIGNATURE BLOCK
        const FOOTER_HTML = `
            <table style="width: 100%; margin-top: 50px; page-break-inside: avoid;">
                <tr>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <p style="font-weight: bold;">İŞVEREN / YETKİLİ</p>
                        <p>CENK DİKMEN</p>
                        <p style="font-size: 10px;">Genel Müdür</p>
                        <br/><br/><br/>
                        <p>İmza: .................................</p>
                    </td>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <p style="font-weight: bold;">ÇALIŞAN / TEBELLÜĞ EDEN</p>
                        <p>${personnel.adSoyad}</p>
                        <br/><br/><br/>
                        <p>Tarih: .................................</p>
                        <p>İmza: .................................</p>
                    </td>
                </tr>
            </table>
        `;

        // Replace Placeholders
        content = content.replace('{{HEADER}}', COMPANY_HEADER_HTML);
        content = content.replace('{{INFO_BLOCK}}', INFO_BLOCK_HTML);
        content = content.replace('{{FOOTER}}', FOOTER_HTML);
        
        // Dynamic Fields Replacement
        content = content.replace(/{{AD_SOYAD}}/g, personnel.adSoyad);
        content = content.replace(/{{TC_NO}}/g, personnel.id);
        content = content.replace(/{{GOREVI}}/g, personnel.gorevi);
        content = content.replace(/{{SICIL_NO}}/g, personnel.sicilNo);
        content = content.replace(/{{ISE_GIRIS_TARIHI}}/g, personnel.iseGirisTarihi || 'Belirtilmemiş');

        // Template specific dynamic fields
        if (template.dynamicFields) {
            template.dynamicFields.forEach(field => {
                const val = dynamicValues[field.key] || `[${field.label}]`;
                // Replace line breaks with <br> for textarea inputs
                const formattedVal = val.replace(/\n/g, '<br/>');
                const regex = new RegExp(`{{${field.key}}}`, 'g');
                content = content.replace(regex, formattedVal);
            });
        }
        
        // Zimmet specific replacement logic if needed (e.g. for the rows)
        if (selectedTemplateId.includes('zimmet') && dynamicValues['ESYALAR']) {
            const items = dynamicValues['ESYALAR'].split('\n').filter(i => i.trim() !== '');
            let rowsHtml = '';
            items.forEach((item, idx) => {
                rowsHtml += `
                    <tr>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${idx + 1}</td>
                        <td style="border: 1px solid black; padding: 10px;">${item}</td>
                    </tr>
                `;
            });
            content = content.replace('{{ZIMMET_ROWS}}', rowsHtml);
        } else {
             // Fallback empty row if no items
            content = content.replace('{{ZIMMET_ROWS}}', '<tr><td colspan="2" style="border: 1px solid black; padding: 10px; text-align: center;">Listelenmiş eşya yok.</td></tr>');
        }

        return content;
    };

    const handlePrint = () => {
        const content = previewRef.current?.innerHTML;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Yazdır - ${documentTemplates.find(t => t.id === selectedTemplateId)?.title}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { 
                            font-family: ${fontFamily}; 
                            font-size: ${fontSize}; 
                            line-height: ${lineHeight};
                            text-align: ${textAlign};
                            padding: 10mm; /* Kenar boşluğunu içerikten veriyoruz */
                            margin: 0;
                        }
                        table { page-break-inside: avoid; }
                        img { max-width: 100%; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const handleDownloadPdf = () => {
        const element = previewRef.current;
        if (!element || typeof html2pdf === 'undefined') {
             alert('PDF modülü yükleniyor, lütfen bekleyip tekrar deneyin.');
             return;
        }

        setIsPdfLoading(true);
        const opt = {
            margin: 5, // mm - Minimum margin
            filename: `belge_${selectedPersonnelId}_${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setIsPdfLoading(false);
        }).catch((err: any) => {
            console.error(err);
            setIsPdfLoading(false);
            alert('PDF oluşturma hatası.');
        });
    };

    const handleExportWord = () => {
        const content = previewRef.current?.innerHTML;
        if (!content) return;

        // Word için basit HTML şablonu
        const preHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Belge</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid black; padding: 5px; }
                </style>
            </head>
            <body>`;
        const postHtml = "</body></html>";
        
        const html = preHtml + content + postHtml;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });
        
        // Blob URL oluştur
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        document.body.appendChild(link);
        link.href = url;
        link.download = `belge_${selectedPersonnelId}.doc`;
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const currentTemplate = documentTemplates.find(t => t.id === selectedTemplateId);
    const btn3dClasses = "shadow-lg border-b-0 transform transition-transform duration-100 ease-in-out active:translate-y-1 active:shadow-none";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white w-full max-w-6xl h-[95vh] flex flex-col shadow-xl rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-blue-800 p-4 flex justify-between items-center text-white shrink-0">
                    <h2 className="text-xl font-bold">Belge ve Tutanak Oluşturucu</h2>
                    <button onClick={onClose} className="text-white hover:text-red-300 font-bold text-2xl">&times;</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Configuration */}
                    <div className="w-1/3 bg-gray-100 p-4 border-r overflow-y-auto">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Personel Seçin</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={selectedPersonnelId}
                                onChange={e => setSelectedPersonnelId(e.target.value)}
                            >
                                {allPersonnel.map(p => (
                                    <option key={p.id} value={p.id}>{p.adSoyad} ({p.gorevi})</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Belge Şablonu</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                            >
                                {documentTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4 p-3 bg-white rounded border shadow-sm">
                             <h3 className="font-bold text-sm border-b pb-1 mb-2 text-indigo-700">Belge İçeriği (Dinamik Alanlar)</h3>
                             {currentTemplate?.dynamicFields?.map(field => (
                                 <div key={field.key} className="mb-2">
                                     <label className="block text-xs font-bold text-gray-600 mb-1">{field.label}</label>
                                     {field.type === 'textarea' ? (
                                         <textarea 
                                            className="w-full border p-2 text-sm rounded" 
                                            rows={3}
                                            placeholder={field.placeholder}
                                            value={dynamicValues[field.key] || ''}
                                            onChange={e => setDynamicValues({...dynamicValues, [field.key]: e.target.value})}
                                         />
                                     ) : (
                                         <input 
                                            type={field.type} 
                                            className="w-full border p-2 text-sm rounded"
                                            placeholder={field.placeholder}
                                            value={dynamicValues[field.key] || ''}
                                            onChange={e => setDynamicValues({...dynamicValues, [field.key]: e.target.value})}
                                         />
                                     )}
                                 </div>
                             ))}
                             {(!currentTemplate?.dynamicFields || currentTemplate.dynamicFields.length === 0) && (
                                 <p className="text-xs text-gray-500 italic">Bu şablon için ek veri girişine gerek yoktur.</p>
                             )}
                        </div>

                        <div className="mb-4 p-3 bg-white rounded border shadow-sm">
                            <h3 className="font-bold text-sm border-b pb-1 mb-2 text-indigo-700">Görünüm Ayarları</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-xs block text-gray-600">Yazı Tipi</label>
                                    <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full border text-xs p-1">
                                        <option value="'Times New Roman', serif">Times New Roman</option>
                                        <option value="'Arial', sans-serif">Arial</option>
                                        <option value="'Segoe UI', sans-serif">Segoe UI</option>
                                        <option value="'Courier New', monospace">Courier New</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block text-gray-600">Yazı Boyutu</label>
                                    <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full border text-xs p-1">
                                        <option value="10px">10px (Küçük)</option>
                                        <option value="11px">11px</option>
                                        <option value="12px">12px (Standart)</option>
                                        <option value="14px">14px (Orta)</option>
                                        <option value="16px">16px (Büyük)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                 <div className="flex gap-1">
                                     <button onClick={() => setTextAlign('left')} className={`p-1 border rounded ${textAlign === 'left' ? 'bg-indigo-100 border-indigo-400' : ''}`}>Left</button>
                                     <button onClick={() => setTextAlign('center')} className={`p-1 border rounded ${textAlign === 'center' ? 'bg-indigo-100 border-indigo-400' : ''}`}>Center</button>
                                     <button onClick={() => setTextAlign('justify')} className={`p-1 border rounded ${textAlign === 'justify' ? 'bg-indigo-100 border-indigo-400' : ''}`}>Justify</button>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <label className="text-xs">Satır:</label>
                                     <select value={lineHeight} onChange={e => setLineHeight(e.target.value)} className="border text-xs p-1">
                                         <option value="1">1.0</option>
                                         <option value="1.2">1.2</option>
                                         <option value="1.5">1.5</option>
                                         <option value="2">2.0</option>
                                     </select>
                                 </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                             <button 
                                onClick={handlePrint}
                                className={`w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex justify-center items-center gap-2 ${btn3dClasses}`}
                            >
                                <span>🖨️</span> YAZDIR
                             </button>
                             <div className="flex gap-2">
                                <button 
                                    onClick={handleDownloadPdf}
                                    disabled={isPdfLoading}
                                    className={`flex-1 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 flex justify-center items-center gap-2 disabled:bg-gray-400 ${btn3dClasses}`}
                                >
                                    {isPdfLoading ? '...' : (
                                        <><span>📄</span> PDF</>
                                    )}
                                </button>
                                <button 
                                    onClick={handleExportWord}
                                    className={`flex-1 py-2 bg-blue-800 text-white font-bold rounded hover:bg-blue-900 flex justify-center items-center gap-2 ${btn3dClasses}`}
                                >
                                    <span>📝</span> WORD
                                </button>
                             </div>
                        </div>
                    </div>

                    {/* Main: Preview */}
                    <div className="flex-1 bg-gray-300 p-8 overflow-y-auto flex justify-center">
                        <div 
                            id="document-preview"
                            className="bg-white shadow-2xl p-[5mm] w-[210mm] min-h-[297mm] box-border select-text"
                            ref={previewRef}
                            style={{
                                fontFamily: fontFamily,
                                fontSize: fontSize,
                                textAlign: textAlign,
                                lineHeight: lineHeight,
                                color: 'black'
                            }}
                            dangerouslySetInnerHTML={{ __html: generateContent() || '' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentGenerator;
