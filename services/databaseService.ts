
import type { User, Personnel, LeaveRecord, TimeLog, AuditLog } from '../types';
import { samplePersonnel } from './sampleData';

declare const pdfjsLib: any;

const DB_VERSION = 3;
const DB_VERSION_KEY = 'personnel_app_db_version';
const USERS_KEY = 'personnel_app_users';
const PERSONNEL_KEY = 'personnel_app_personnel';
const AUDIT_LOGS_KEY = 'personnel_app_audit_logs';
const SETTINGS_KEY = 'personnel_app_settings';

const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const parseTurkishDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Matches dd.mm.yyyy or dd/mm/yyyy
    const match = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    return null;
};

const parseCurrency = (str: string): number => {
    if (!str) return 0;
    // Remove dots (thousands separator) and replace comma with dot
    const cleanStr = str.replace(/\./g, '').replace(',', '.');
    // Extract first valid number
    const match = cleanStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
};

export class DatabaseService {
    public static initDB() {
        const dbVersion = parseInt(localStorage.getItem(DB_VERSION_KEY) || '0', 10);
        if (dbVersion < DB_VERSION) {
            const adminUser: User = { id: 1, username: 'admin', password: '1234', role: 'admin' };
            const standardUser: User = { id: 2, username: 'ahmet', password: '1234', role: 'user', personnelId: '10909274686' };
            localStorage.setItem(USERS_KEY, JSON.stringify([adminUser, standardUser]));
            localStorage.setItem(PERSONNEL_KEY, JSON.stringify(samplePersonnel));
            localStorage.setItem(DB_VERSION_KEY, String(DB_VERSION));
        }
    }

    // --- SETTINGS ---
    public static getSettings(): { workStartTime: string } {
        const defaults = { workStartTime: '08:30' };
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        } catch (e) {
            return defaults;
        }
    }

    public static saveSettings(settings: { workStartTime: string }): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // --- AUDIT LOGGING ---
    public static logAction(user: string, action: AuditLog['action'], target: string, details: string) {
        const logs = this.getAuditLogs();
        const newLog: AuditLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user,
            action,
            target,
            details
        };
        logs.unshift(newLog); // Add to beginning
        // Keep only last 1000 logs to save space
        if (logs.length > 1000) logs.pop();
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    }

    public static getAuditLogs(): AuditLog[] {
        return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]');
    }
    
    public static getUsers(): User[] {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    }
    
    public static findUser(username: string): User | undefined {
        return this.getUsers().find(u => u.username === username);
    }
    
    public static createUser(user: Omit<User, 'id'>, actor: string = 'System'): User {
        const users = this.getUsers();
        const newUser: User = { ...user, id: Date.now() };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        this.logAction(actor, 'CREATE', `User: ${user.username}`, `Role: ${user.role}`);
        return newUser;
    }

    public static updateUser(user: User, actor: string = 'System'): User {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        
        if (index !== -1) {
            const oldUser = users[index];
            const changes: string[] = [];
            
            if (oldUser.username !== user.username) changes.push(`Username: '${oldUser.username}' -> '${user.username}'`);
            if (oldUser.role !== user.role) changes.push(`Role: '${oldUser.role}' -> '${user.role}'`);
            if (oldUser.personnelId !== user.personnelId) changes.push(`Linked Personnel: '${oldUser.personnelId || ''}' -> '${user.personnelId || ''}'`);
            if (user.password && user.password !== oldUser.password) changes.push('Password changed');
            
            const details = changes.length > 0 ? changes.join(' | ') : 'No specific changes detected';

            users[index] = { ...users[index], ...user };
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            this.logAction(actor, 'UPDATE', `User: ${user.username}`, details);
            return users[index];
        }
        throw new Error('User not found');
    }

    public static deleteUser(userId: number, actor: string = 'System'): void {
        let users = this.getUsers();
        const userToDelete = users.find(u => u.id === userId);
        users = users.filter(u => u.id !== userId);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        if (userToDelete) {
            this.logAction(actor, 'DELETE', `User: ${userToDelete.username}`, 'User deleted');
        }
    }
    
    public static getPersonnel(): Personnel[] {
        return JSON.parse(localStorage.getItem(PERSONNEL_KEY) || '[]');
    }
    
    public static getPersonnelById(id: string): Personnel | undefined {
        return this.getPersonnel().find(p => p.id === id);
    }
    
    public static savePersonnel(personnel: Personnel, actor: string = 'System'): Personnel {
        let personnelList = this.getPersonnel();
        const existingIndex = personnelList.findIndex(p => p.id === personnel.id);
        let action: 'CREATE' | 'UPDATE' = 'CREATE';
        let diff = 'New Record';

        if (existingIndex > -1) {
            action = 'UPDATE';
            const old = personnelList[existingIndex];
            const changes: string[] = [];

            const compareField = (label: string, oldVal: any, newVal: any) => {
                if (oldVal != newVal) { // loose equality to catch number vs string if any
                    changes.push(`${label}: '${oldVal || ''}' -> '${newVal || ''}'`);
                }
            };

            compareField('Ad Soyad', old.adSoyad, personnel.adSoyad);
            compareField('Görevi', old.gorevi, personnel.gorevi);
            compareField('Sicil No', old.sicilNo, personnel.sicilNo);
            compareField('Maaş', old.baseSalary, personnel.baseSalary);
            compareField('Saatlik Ücret', old.hourlyRate, personnel.hourlyRate);
            compareField('Telefon', old.telefon, personnel.telefon);
            compareField('Adres', old.adres, personnel.adres);
            compareField('SGK No', old.sgkNo, personnel.sgkNo);
            compareField('İşe Giriş', old.iseGirisTarihi, personnel.iseGirisTarihi);
            compareField('İşten Çıkış', old.istenAyrilisTarihi, personnel.istenAyrilisTarihi);

            // Check documents count
            if ((old.documents?.length || 0) !== (personnel.documents?.length || 0)) {
                changes.push(`Documents: ${old.documents?.length || 0} -> ${personnel.documents?.length || 0}`);
            }

            diff = changes.length > 0 ? changes.join(' | ') : 'Minor update (No tracked fields changed)';
            personnelList[existingIndex] = personnel;
        } else {
            personnelList.push(personnel);
        }
        
        localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnelList));
        this.logAction(actor, action, `Personnel: ${personnel.adSoyad}`, diff);
        return personnel;
    }

    public static deletePersonnel(id: string, actor: string = 'System'): void {
        let personnelList = this.getPersonnel();
        const p = personnelList.find(i => i.id === id);
        personnelList = personnelList.filter(p => p.id !== id);
        localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnelList));
        if (p) {
            this.logAction(actor, 'DELETE', `Personnel: ${p.adSoyad}`, 'Record deleted');
        }
    }

    // --- IMPROVED PDF IMPORT ---
    public static async importFromPdf(file: File, actor: string = 'System'): Promise<{ success: boolean, message: string, personnel?: Personnel }> {
        try {
            if (!pdfjsLib) return { success: false, message: 'PDF kütüphanesi yüklenemedi.' };

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            let fullText = '';
            const maxPages = Math.min(pdf.numPages, 2);
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items.map((item: any) => item.str);
                fullText += items.join(' ') + ' '; 
            }

            // 1. TC ID (11 Digits)
            const tcMatch = fullText.match(/\b[1-9][0-9]{10}\b/);
            const tcNo = tcMatch ? tcMatch[0] : null;
            if (!tcNo) return { success: false, message: 'PDF içinde T.C. Kimlik No bulunamadı.' };

            // 2. Name 
            let name = "";
            const nameRegex = /(?:Adı Soyadı|ADI SOYADI)[\s:]+([A-ZİĞÜŞÖÇ ]+)/i;
            const nameMatch = fullText.match(nameRegex);
            if (nameMatch && nameMatch[1]) {
                name = nameMatch[1].trim();
            } else {
                name = "BİLİNMEYEN PERSONEL";
            }

            // 3. Entry Date
            let entryDate: string | undefined = undefined;
            const entryRegex = /(?:Giriş|İşe Başlama|Tarihi)[\D]{0,20}(\d{1,2}[./]\d{1,2}[./]\d{4})/i;
            const entryMatch = fullText.match(entryRegex);
            if (entryMatch) {
                const parsed = parseTurkishDate(entryMatch[1]);
                if (parsed) entryDate = parsed;
            }

            // 4. Salary
            let salary = 0;
            const salaryRegex = /(?:Net Ödenen|Ele Geçen|Net Ücret|Ödenecek Tutar)[\D]{0,20}(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i;
            const salaryMatch = fullText.match(salaryRegex);
            if (salaryMatch) {
                salary = parseCurrency(salaryMatch[1]);
            }

            // 5. SGK No
            let sgkNo = "";
            const sgkRegex = /(?:SGK|Sicil)[\sNo]*[:]*\s*(\d{13}|\d{4}-\d{2,})/;
            const sgkMatch = fullText.match(sgkRegex);
            if (sgkMatch) sgkNo = sgkMatch[1];

            // 6. Phone
            let phone = "";
            const phoneMatch = fullText.match(/(0\s?5\d{2})\s?\d{3}\s?\d{2}\s?\d{2}/);
            if (phoneMatch) phone = phoneMatch[0].replace(/\s/g, '');

            // 7. Job Title
            let jobTitle = "Personel";
            const jobRegex = /(?:Görevi|Unvanı|Ünvanı)[\s:]+([A-ZİĞÜŞÖÇa-zıüöçşğ ]+)/;
            const jobMatch = fullText.match(jobRegex);
            if (jobMatch && jobMatch[1]) {
                const cleanJob = jobMatch[1].trim();
                if (cleanJob.length > 3 && cleanJob.length < 30) jobTitle = cleanJob;
            }

            // DB UPDATE
            let personnelList = this.getPersonnel();
            const existingIndex = personnelList.findIndex(p => p.id === tcNo);
            let savedPersonnel: Personnel;

            const newData: Partial<Personnel> = {
                iseGirisTarihi: entryDate,
                sgkNo,
                telefon: phone,
                gorevi: jobTitle,
                baseSalary: salary > 0 ? salary : undefined,
                hourlyRate: salary > 0 ? salary / 225 : undefined
            };
            
            if (name !== "BİLİNMEYEN PERSONEL") newData.adSoyad = name;

            if (existingIndex > -1) {
                const p = personnelList[existingIndex];
                personnelList[existingIndex] = {
                    ...p,
                    ...Object.fromEntries(Object.entries(newData).filter(([_, v]) => v !== undefined && v !== ""))
                };
                savedPersonnel = personnelList[existingIndex];
                this.logAction(actor, 'IMPORT', `Personnel: ${savedPersonnel.adSoyad}`, 'Updated via PDF Import');
            } else {
                savedPersonnel = {
                    id: tcNo,
                    sicilNo: Math.floor(Math.random() * 10000).toString(),
                    adSoyad: name,
                    gorevi: jobTitle,
                    iseGirisTarihi: entryDate,
                    baseSalary: salary,
                    hourlyRate: salary > 0 ? salary / 225 : 0,
                    sgkNo,
                    telefon: phone,
                    adres: "",
                    leaves: [],
                    timeLogs: [],
                    bonuses: [],
                    deductions: [],
                    documents: []
                };
                personnelList.push(savedPersonnel);
                this.logAction(actor, 'IMPORT', `Personnel: ${savedPersonnel.adSoyad}`, 'Created via PDF Import');
            }

            localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnelList));
            return { 
                success: true, 
                message: `Veri çekme başarılı:\nAd: ${savedPersonnel.adSoyad}\nMaaş: ${salary}\nTarih: ${entryDate}`, 
                personnel: savedPersonnel 
            };

        } catch (error) {
            console.error("PDF Error:", error);
            return { success: false, message: 'PDF işlenirken hata oluştu.' };
        }
    }
    
    public static addLeave(leaveRequest: Omit<LeaveRecord, 'id' | 'status' | 'kacGun'>): LeaveRecord {
        const personnel = this.getPersonnelById(leaveRequest.personnelId);
        if (!personnel) throw new Error("Personel bulunamadı");
        const newLeave: LeaveRecord = { 
            ...leaveRequest, 
            id: `leave_${Date.now()}`,
            status: 'pending',
            kacGun: calculateDays(leaveRequest.startDate, leaveRequest.endDate)
        };
        personnel.leaves.push(newLeave);
        this.savePersonnel(personnel, 'System (Leave Request)');
        return newLeave;
    }

    public static updateLeaveStatus(leaveId: string, personnelId: string, status: 'approved' | 'rejected', actor: string = 'System'): LeaveRecord {
        const personnel = this.getPersonnelById(personnelId);
        if (!personnel) throw new Error("Personel bulunamadı");
        const leaveIndex = personnel.leaves.findIndex(l => l.id === leaveId);
        if (leaveIndex === -1) throw new Error("İzin kaydı bulunamadı");
        personnel.leaves[leaveIndex].status = status;
        this.savePersonnel(personnel, actor);
        return personnel.leaves[leaveIndex];
    }

    public static addTimeLog(log: Omit<TimeLog, 'id'>): TimeLog {
        const personnel = this.getPersonnelById(log.personnelId);
        if (!personnel) throw new Error("Personel bulunamadı");
        const newLog: TimeLog = { ...log, id: `log_${Date.now()}` };
        if(!personnel.timeLogs) personnel.timeLogs = [];
        personnel.timeLogs.push(newLog);
        this.savePersonnel(personnel, 'System (Time Log)');
        return newLog;
    }

    public static updateTimeLog(updatedLog: TimeLog, actor: string = 'System'): TimeLog {
        const personnel = this.getPersonnelById(updatedLog.personnelId);
        if (!personnel) throw new Error("Personel bulunamadı");
        const logIndex = personnel.timeLogs.findIndex(l => l.id === updatedLog.id);
        if (logIndex === -1) throw new Error("Kayıt bulunamadı");
        personnel.timeLogs[logIndex] = updatedLog;
        this.savePersonnel(personnel, actor);
        return personnel.timeLogs[logIndex];
    }
    
    public static deleteTimeLog(logId: string, personnelId: string, actor: string = 'System'): void {
        const personnel = this.getPersonnelById(personnelId);
        if (!personnel) throw new Error("Personel bulunamadı");
        personnel.timeLogs = personnel.timeLogs.filter(l => l.id !== logId);
        this.savePersonnel(personnel, actor);
    }
    
    public static addTimeLogsBatch(logs: Omit<TimeLog, 'id'>[]): void {
        let personnelList = this.getPersonnel();
        let updated = false;
        logs.forEach(log => {
            const pIndex = personnelList.findIndex(p => p.id === log.personnelId);
            if (pIndex !== -1) {
                const newLog: TimeLog = { ...log, id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
                if (!personnelList[pIndex].timeLogs) personnelList[pIndex].timeLogs = [];
                personnelList[pIndex].timeLogs.push(newLog);
                updated = true;
            }
        });
        if (updated) localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnelList));
    }

    public static backupData(): string {
        return JSON.stringify({
            version: DB_VERSION,
            users: this.getUsers(),
            personnel: this.getPersonnel(),
            settings: this.getSettings()
        }, null, 2);
    }

    public static triggerBackupDownload(): void {
        try {
            const jsonData = this.backupData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `personnel_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Yedekleme hatası.");
        }
    }

    public static restoreData(jsonData: string, actor: string = 'System'): { success: boolean, message: string } {
        try {
            const data = JSON.parse(jsonData);
            if (data.users && data.personnel) {
                localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
                localStorage.setItem(PERSONNEL_KEY, JSON.stringify(data.personnel));
                localStorage.setItem(DB_VERSION_KEY, String(data.version || DB_VERSION));
                if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
                this.logAction(actor, 'IMPORT', 'Database', 'Full System Restore');
                return { success: true, message: 'Geri yükleme başarılı.' };
            }
            return { success: false, message: 'Geçersiz yedek dosyası.' };
        } catch (error) {
            return { success: false, message: 'Dosya okuma hatası.' };
        }
    }
}
