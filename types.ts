
export interface User {
    id: number;
    username: string;
    password?: string; // Should not be passed around, but needed for creation/login
    role: 'admin' | 'user';
    personnelId?: string; // Link user to a personnel record
}

export interface Bonus {
    id: string;
    date: string;
    amount: number;
    description: string;
}

export interface Deduction {
    id: string;
    date: string;
    amount: number;
    description: string;
}

export interface PersonnelDocument {
    id: string;
    name: string;
    type: string; // 'image' | 'pdf'
    data: string; // Base64
    uploadDate: string;
}

export interface Personnel {
    id: string; // T.C. Kimlik No
    sicilNo: string;
    adSoyad: string;
    gorevi: string;
    rafNo?: string;
    dogumTarihi?: string;
    iseGirisTarihi?: string;
    istenAyrilisTarihi?: string;
    istenAyrilisNedeni?: string;
    sgkNo?: string;
    babaAdi?: string;
    telefon?: string; // New Field
    adres?: string;   // New Field
    kayitTarihi?: string;
    resim?: string; // Base64 string for image
    leaves: LeaveRecord[];
    timeLogs: TimeLog[];
    baseSalary?: number;
    hourlyRate?: number;
    bonuses?: Bonus[];
    deductions?: Deduction[];
    documents?: PersonnelDocument[];
}

export interface LeaveRecord {
    id: string;
    personnelId: string;
    startDate: string;
    endDate: string;
    izinCesidi: string;
    kacGun: number;
    aciklama: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface TimeLog {
    id: string;
    personnelId: string;
    date: string;
    checkIn: string;
    checkOut: string;
}

export interface AppContextType {
    currentUser: User | null;
    login: (user: User) => void;
    logout: () => void;
}

export interface TemplateField {
    key: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'number';
    placeholder?: string;
}

export interface DocumentTemplate {
    id: string;
    title: string;
    content: string; // HTML content with placeholders like {{AD_SOYAD}}
    dynamicFields?: TemplateField[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    user: string; // Username of the actor
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
    target: string; // e.g., "Personnel: Ahmet Yılmaz" or "File: data.pdf"
    details: string; // Description of change
}
