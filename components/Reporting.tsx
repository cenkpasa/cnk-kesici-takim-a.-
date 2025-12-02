
import React, { useState } from 'react';
import type { Personnel, TimeLog, Bonus, Deduction } from '../types';

interface ReportingProps {
    personnelList: Personnel[];
}

interface IndividualReport {
    personnelId: string;
    adSoyad: string;
    workDays: number;
    totalHours: number;
    requiredHours: number;
    overtimeHours: number; // %50 Zamlı
    sundayHours: number;   // %100 Zamlı (Hafta Tatili)
    undertimeHours: number;
    baseSalary: number;
    hourlyRate: number;
    proratedBaseSalary: number;
    overtimePay: number;
    undertimeDeduction: number;
    totalBonuses: number;
    totalDeductions: number;
    netSalary: number;
    bonusesInPeriod: Bonus[];
    deductionsInPeriod: Deduction[];
}

interface ReportData {
    isSinglePersonnel: boolean;
    startDate: string;
    endDate: string;
    items: IndividualReport[];
    grandTotalWorkDays: number;
    grandTotalHours: number;
    grandTotalNetSalary: number;
    grandTotalOvertimeHours: number;
    grandTotalUndertimeHours: number;
}

const calculateDuration = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    try {
        const [inHours, inMinutes] = checkIn.split(':').map(Number);
        const [outHours, outMinutes] = checkOut.split(':').map(Number);
        
        let totalInMinutes = inHours * 60 + inMinutes;
        let totalOutMinutes = outHours * 60 + outMinutes;
        
        if (totalOutMinutes < totalInMinutes) {
            totalOutMinutes += 24 * 60;
        }
        
        const diffMinutes = totalOutMinutes - totalInMinutes;
        return diffMinutes > 0 ? diffMinutes / 60 : 0;
    } catch(e) {
        console.error("Error calculating duration:", e);
        return 0;
    }
};

const Reporting: React.FC<ReportingProps> = ({ personnelList }) => {
    const [filter, setFilter] = useState({
        personnelId: 'all',
        startDate: '',
        endDate: '',
    });
    const [report, setReport] = useState<ReportData | null>(null);

    const setQuickFilter = (type: 'daily' | 'weekly' | 'monthly') => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (type === 'daily') {
            // Start and End is today
        } else if (type === 'weekly') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
            end.setDate(start.getDate() + 6);
        } else if (type === 'monthly') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        
        setFilter({
            ...filter,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    const calculateReport = () => {
        if (!filter.startDate || !filter.endDate) {
            alert('Lütfen bir başlangıç ve bitiş tarihi seçin.');
            return;
        }

        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);
        if (start > end) {
            alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
            return;
        }
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const daysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const isSinglePersonnel = filter.personnelId !== 'all';
        const targetPersonnel = isSinglePersonnel
            ? personnelList.filter(p => p.id === filter.personnelId)
            : personnelList;

        if (targetPersonnel.length === 0) {
            alert('Rapor oluşturulacak personel bulunamadı.');
            setReport(null);
            return;
        }

        const items: IndividualReport[] = targetPersonnel.map(person => {
             const logs = (person.timeLogs || []).filter(log => {
                const logDate = new Date(log.date);
                return logDate >= start && logDate <= end;
             });

             let totalHours = 0;
             let sundayHours = 0; 

             logs.forEach(log => {
                 const duration = calculateDuration(log.checkIn, log.checkOut);
                 const date = new Date(log.date);
                 if (date.getDay() === 0) { // 0 is Sunday
                     sundayHours += duration;
                 }
                 totalHours += duration;
             });

             const uniqueDays = new Set(logs.map(l => l.date));
             const workDays = uniqueDays.size;
             
             const requiredHours = workDays * 8; 
             
             const regularHoursWorked = totalHours - sundayHours;
             let overtimeHours = Math.max(0, regularHoursWorked - requiredHours);
             const undertimeHours = Math.max(0, requiredHours - regularHoursWorked);

             const baseSalary = person.baseSalary || 0;
             const hourlyRate = person.hourlyRate || 0;
             
             const proratedBaseSalary = (baseSalary / 30) * daysInRange;

             const overtimePay = overtimeHours * (hourlyRate * 1.5);
             const sundayPay = sundayHours * (hourlyRate * 2.0); 

             const totalOvertimePay = overtimePay + sundayPay;

             const undertimeDeduction = undertimeHours * hourlyRate;

             const bonusesInPeriod = (person.bonuses || []).filter(b => {
                 const d = new Date(b.date);
                 return d >= start && d <= end;
             });
             const totalBonuses = bonusesInPeriod.reduce((sum, b) => sum + b.amount, 0);

             const deductionsInPeriod = (person.deductions || []).filter(deduction => {
                 const deductionDate = new Date(deduction.date);
                 return deductionDate >= start && deductionDate <= end;
             });
             const totalDeductions = deductionsInPeriod.reduce((sum, d) => sum + d.amount, 0);

             const netSalary = proratedBaseSalary + totalOvertimePay + totalBonuses - undertimeDeduction - totalDeductions;

             return {
                 personnelId: person.id,
                 adSoyad: person.adSoyad,
                 workDays,
                 totalHours,
                 requiredHours,
                 overtimeHours,
                 sundayHours,
                 undertimeHours,
                 baseSalary,
                 hourlyRate,
                 proratedBaseSalary,
                 overtimePay: totalOvertimePay,
                 undertimeDeduction,
                 totalBonuses,
                 totalDeductions,
                 netSalary,
                 bonusesInPeriod,
                 deductionsInPeriod
             };
        });

        const grandTotalWorkDays = items.reduce((sum, i) => sum + i.workDays, 0);
        const grandTotalHours = items.reduce((sum, i) => sum + i.totalHours, 0);
        const grandTotalOvertimeHours = items.reduce((sum, i) => sum + i.overtimeHours + i.sundayHours, 0);
        const grandTotalUndertimeHours = items.reduce((sum, i) => sum + i.undertimeHours, 0);
        const grandTotalNetSalary = items.reduce((sum, i) => sum + i.netSalary, 0);

        setReport({
            isSinglePersonnel,
            startDate: filter.startDate,
            endDate: filter.endDate,
            items,
            grandTotalWorkDays,
            grandTotalHours,
            grandTotalOvertimeHours,
            grandTotalUndertimeHours,
            grandTotalNetSalary
        });
    };

    const handleClear = () => {
        setFilter({
            personnelId: 'all',
            startDate: '',
            endDate: ''
        });
        setReport(null);
    };

    const handleExportCSV = () => {
        if (!report) return;
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += `Rapor Türü: Toplu Personel Maaş Listesi\n`;
        csvContent += `Tarih Aralığı: ${report.startDate} - ${report.endDate}\n\n`;
        csvContent += "Personel,Çalışma Günü,Toplam Saat,Fazla Mesai (Normal + Pazar),Eksik Süre,Primler,Kesintiler,Net Maaş\n";
        report.items.forEach(item => {
            csvContent += `"${item.adSoyad}",${item.workDays},${item.totalHours.toFixed(2)},${(item.overtimeHours + item.sundayHours).toFixed(2)},${item.undertimeHours.toFixed(2)},${item.totalBonuses.toFixed(2)},${item.totalDeductions.toFixed(2)},${item.netSalary.toFixed(2)}\n`;
        });
        csvContent += `GENEL TOPLAM,${report.grandTotalWorkDays},${report.grandTotalHours.toFixed(2)},${report.grandTotalOvertimeHours.toFixed(2)},${report.grandTotalUndertimeHours.toFixed(2)},-,-,${report.grandTotalNetSalary.toFixed(2)}\n`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapor_${report.startDate}_${report.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!report) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Maaş Raporu Yazdır</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
                        h1, h3 { text-align: center; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .total-row { font-weight: bold; background-color: #e6e6e6; }
                        .money { text-align: right; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>PERSONEL MAAŞ RAPORU</h1>
                    <h3>${new Date(report.startDate).toLocaleDateString('tr-TR')} - ${new Date(report.endDate).toLocaleDateString('tr-TR')}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Adı Soyadı</th>
                                <th class="center">Gün</th>
                                <th class="center">Toplam Saat</th>
                                <th class="center">Normal FM (%50)</th>
                                <th class="center">Pazar FM (%100)</th>
                                <th class="center">Eksik</th>
                                <th class="money">Primler</th>
                                <th class="money">Kesintiler</th>
                                <th class="money">Net Maaş</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.items.map(item => `
                                <tr>
                                    <td>${item.adSoyad}</td>
                                    <td class="center">${item.workDays}</td>
                                    <td class="center">${item.totalHours.toFixed(2)}</td>
                                    <td class="center">${item.overtimeHours.toFixed(2)}</td>
                                    <td class="center">${item.sundayHours.toFixed(2)}</td>
                                    <td class="center">${item.undertimeHours.toFixed(2)}</td>
                                    <td class="money">${item.totalBonuses.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                                    <td class="money">${item.totalDeductions.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                                    <td class="money">${item.netSalary.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td>GENEL TOPLAM</td>
                                <td class="center">${report.grandTotalWorkDays}</td>
                                <td class="center">${report.grandTotalHours.toFixed(2)}</td>
                                <td class="center" colspan="2">${report.grandTotalOvertimeHours.toFixed(2)} (Top.)</td>
                                <td class="center">${report.grandTotalUndertimeHours.toFixed(2)}</td>
                                <td class="money">-</td>
                                <td class="money">-</td>
                                <td class="money">${report.grandTotalNetSalary.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; text-align: center;">
                        <p>Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const formatCurrency = (value?: number) => {
        return (value || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    };

    return (
        <div className="p-2 border bg-gray-200 shadow-inner">
            <h2 className="font-bold border-b pb-1 mb-2">PUANTAJ VE MAAŞ HESAPLAMA</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <div>
                    <label className="block text-xs font-semibold">PERSONEL</label>
                    <select
                        value={filter.personnelId}
                        onChange={(e) => setFilter({ ...filter, personnelId: e.target.value })}
                        className="w-full mt-1 border border-gray-400 bg-white px-1 py-0.5 text-sm"
                    >
                        <option value="all">Tümü</option>
                        {personnelList.map(p => (
                            <option key={p.id} value={p.id}>{p.adSoyad}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold">BAŞLANGIÇ TARİHİ</label>
                    <input
                        type="date"
                        value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        className="w-full mt-1 border border-gray-400 px-1 py-0.5 bg-white text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold">BİTİŞ TARİHİ</label>
                    <input
                        type="date"
                        value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        className="w-full mt-1 border border-gray-400 px-1 py-0.5 bg-white text-sm"
                    />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <div className="flex gap-1 justify-end">
                         <button onClick={() => setQuickFilter('daily')} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs border border-blue-300 rounded">Bugün</button>
                         <button onClick={() => setQuickFilter('weekly')} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs border border-blue-300 rounded">Bu Hafta</button>
                         <button onClick={() => setQuickFilter('monthly')} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs border border-blue-300 rounded">Bu Ay</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={calculateReport} className="flex-1 px-4 py-2 bg-yellow-300 border border-yellow-500 rounded shadow-sm hover:bg-yellow-400 font-semibold text-xs">HESAPLA</button>
                        <button onClick={handleClear} className="px-4 py-2 bg-gray-300 border border-gray-500 rounded shadow-sm hover:bg-gray-400 font-semibold text-xs">TEMİZLE</button>
                    </div>
                </div>
            </div>
            {report && (
                <div className="mt-4 border-t pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                         <h3 className="font-bold">Sonuçlar</h3>
                         <div className="flex space-x-2">
                            <button onClick={handlePrint} className="px-3 py-1 bg-blue-600 text-white text-xs rounded shadow hover:bg-blue-700 flex items-center gap-1">YAZDIR</button>
                            <button onClick={handleExportCSV} className="px-3 py-1 bg-green-600 text-white text-xs rounded shadow hover:bg-green-700 flex items-center gap-1">CSV</button>
                         </div>
                    </div>
                    
                    {report.isSinglePersonnel ? (
                        <div className="p-2 bg-white border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 text-sm mb-2 border-b pb-2">
                                <div><strong>Çalışma Günü:</strong> {report.items[0].workDays}</div>
                                <div><strong>Gerekli Saat:</strong> {report.items[0].requiredHours.toFixed(2)}</div>
                                <div><strong>Çalışılan Saat:</strong> {report.items[0].totalHours.toFixed(2)}</div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Hafta İçi FM: {report.items[0].overtimeHours.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500">Pazar FM: {report.items[0].sundayHours.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <h4 className="font-semibold text-sm mb-1 text-blue-800">Maaş Dökümü</h4>
                             <div className="grid grid-cols-2 gap-x-4 text-sm">
                                <div><strong>Dönemlik Ana Maaş:</strong> {formatCurrency(report.items[0].proratedBaseSalary)}</div>
                                <div><strong>Mesai Kazancı (%50+%100):</strong> <span className="text-green-600 font-semibold">{formatCurrency(report.items[0].overtimePay)}</span></div>
                                <div><strong>Toplam Primler:</strong> {formatCurrency(report.items[0].totalBonuses)}</div>
                                <div><strong>Eksik Süre Kesintisi:</strong> <span className="text-red-600 font-semibold">{formatCurrency(report.items[0].undertimeDeduction)}</span></div>
                                <div><strong>Toplam Kesintiler:</strong> {formatCurrency(report.items[0].totalDeductions)}</div>
                             </div>
                             <div className="text-right mt-2 font-bold text-lg border-t pt-1 text-blue-900 bg-blue-50 p-1">
                                TAHMİNİ NET MAAŞ: {formatCurrency(report.items[0].netSalary)}
                             </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                             <table className="w-full text-sm text-left border-collapse border border-gray-400">
                                <thead className="bg-gray-300 text-gray-800 font-bold">
                                    <tr>
                                        <th className="border border-gray-400 px-2 py-1">Adı Soyadı</th>
                                        <th className="border border-gray-400 px-2 py-1 text-center">Gün</th>
                                        <th className="border border-gray-400 px-2 py-1 text-center">Saat</th>
                                        <th className="border border-gray-400 px-2 py-1 text-right">Normal FM</th>
                                        <th className="border border-gray-400 px-2 py-1 text-right">Pazar FM</th>
                                        <th className="border border-gray-400 px-2 py-1 text-right">Net Maaş</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {report.items.map((item) => (
                                        <tr key={item.personnelId} className="hover:bg-blue-50">
                                            <td className="border border-gray-400 px-2 py-1">{item.adSoyad}</td>
                                            <td className="border border-gray-400 px-2 py-1 text-center">{item.workDays}</td>
                                            <td className="border border-gray-400 px-2 py-1 text-center">{item.totalHours.toFixed(2)}</td>
                                            <td className="border border-gray-400 px-2 py-1 text-right text-green-600">{item.overtimeHours.toFixed(2)}</td>
                                            <td className="border border-gray-400 px-2 py-1 text-right text-orange-600">{item.sundayHours.toFixed(2)}</td>
                                            <td className="border border-gray-400 px-2 py-1 text-right font-bold text-blue-900">
                                                {formatCurrency(item.netSalary)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reporting;
