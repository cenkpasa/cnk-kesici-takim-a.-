
import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { DatabaseService } from '../services/databaseService';
import type { User } from '../types';

type ViewState = 'login' | 'register' | 'recovery';

const LoginScreen: React.FC = () => {
    const [view, setView] = useState<ViewState>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [sgkNo, setSgkNo] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login } = useContext(AppContext);

    const clearForm = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setSgkNo('');
        setError('');
        setSuccessMsg('');
    };

    const switchView = (newView: ViewState) => {
        clearForm();
        setView(newView);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        const user = DatabaseService.findUser(username);
        
        if (!user || user.password !== password) {
            setError('Geçersiz kullanıcı adı veya şifre.');
            DatabaseService.logAction('Anonymous', 'LOGIN', 'Failed Login', `Attempted username: ${username}`);
            return;
        }

        if (user.role === 'admin') {
            DatabaseService.logAction(user.username, 'LOGIN', 'System', 'Admin Login Success');
            login(user);
        } else {
            if (!user.personnelId) {
                setError('Bu kullanıcı hesabı bir personel kartı ile ilişkilendirilmemiş.');
                return;
            }

            const personnel = DatabaseService.getPersonnelById(user.personnelId);

            if (!personnel) {
                setError('İlişkili personel kaydı veritabanında bulunamadı.');
                return;
            }

            // Opsiyonel: Giriş sırasında SGK No doğrulaması isteniyorsa
            if (sgkNo && personnel.sgkNo !== sgkNo) {
                setError('Girdiğiniz SGK Numarası sistemdeki kayıtlarla eşleşmiyor.');
                DatabaseService.logAction(username, 'LOGIN', 'Failed Login', 'SGK Mismatch');
                return;
            }

            DatabaseService.logAction(user.username, 'LOGIN', 'System', 'User Login Success');
            login(user);
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        // 1. Check if username exists
        const existingUser = DatabaseService.findUser(username);
        if (existingUser) {
            setError('Bu kullanıcı adı zaten alınmış.');
            return;
        }

        // 2. Validate SGK No (Must match a personnel)
        const allPersonnel = DatabaseService.getPersonnel();
        const personnel = allPersonnel.find(p => p.sgkNo === sgkNo);

        if (!personnel) {
            setError('Bu SGK numarasına ait bir personel kaydı bulunamadı. Lütfen İK ile görüşün.');
            return;
        }

        // 3. Check if this personnel already has a user account
        const allUsers = DatabaseService.getUsers();
        const alreadyHasAccount = allUsers.find(u => u.personnelId === personnel.id);
        if (alreadyHasAccount) {
            setError('Bu personel için zaten bir kullanıcı hesabı mevcut.');
            return;
        }

        // 4. Create User
        DatabaseService.createUser({
            username,
            password,
            role: 'user',
            personnelId: personnel.id
        }, 'Self-Register');

        setSuccessMsg('Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.');
        setTimeout(() => switchView('login'), 2000);
    };

    const handleRecovery = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor.');
            return;
        }

        // 1. Find User
        const user = DatabaseService.findUser(username);
        if (!user) {
            setError('Kullanıcı bulunamadı.');
            return;
        }

        // 2. Verify Identity via SGK No
        // If admin, we cannot verify via SGK easily in this demo without email. 
        // So we restrict this to standard users who have linked personnel.
        if (user.role === 'admin') {
            setError('Yönetici hesapları bu ekrandan sıfırlanamaz. Lütfen sistem yöneticisine başvurun.');
            return;
        }

        if (!user.personnelId) {
            setError('Bu hesap doğrulanamıyor (Personel kaydı yok).');
            return;
        }

        const personnel = DatabaseService.getPersonnelById(user.personnelId);
        if (!personnel || personnel.sgkNo !== sgkNo) {
            setError('Güvenlik doğrulaması başarısız. SGK No eşleşmedi.');
            return;
        }

        // 3. Update Password
        DatabaseService.updateUser({
            ...user,
            password: password
        }, 'Self-Recovery');

        setSuccessMsg('Şifreniz başarıyla güncellendi. Yönlendiriliyorsunuz...');
        setTimeout(() => switchView('login'), 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
            {/* Abstract shapes for background */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="bg-[#1e293b] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-700 z-10 relative">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">CNK Portal</h2>
                        <p className="text-slate-400 text-sm mt-2">
                            {view === 'login' && 'Personel Yönetim ve Takip Sistemi'}
                            {view === 'register' && 'Yeni Personel Hesabı Oluştur'}
                            {view === 'recovery' && 'Hesap Kurtarma & Şifre Sıfırlama'}
                        </p>
                    </div>

                    {/* --- LOGIN FORM --- */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Kullanıcı adınız"
                                    required
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Şifre</label>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                    SGK No <span className="text-[10px] normal-case font-normal text-slate-500">(Opsiyonel Doğrulama)</span>
                                </label>
                                <input
                                    type="text"
                                    value={sgkNo}
                                    onChange={(e) => setSgkNo(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Güvenlik için SGK No"
                                />
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-rose-400 bg-rose-900/20 border border-rose-900/50 rounded-lg flex items-center">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {error}
                                </div>
                            )}
                             {successMsg && (
                                <div className="p-3 text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all"
                            >
                                GÜVENLİ GİRİŞ
                            </button>
                            
                            <div className="flex justify-between mt-4 text-xs">
                                <button type="button" onClick={() => switchView('recovery')} className="text-slate-400 hover:text-teal-400 transition-colors">
                                    Şifremi Unuttum?
                                </button>
                                <button type="button" onClick={() => switchView('register')} className="text-slate-400 hover:text-teal-400 transition-colors">
                                    Hesap Oluştur
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- REGISTER FORM --- */}
                    {view === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 text-xs text-blue-200 mb-4">
                                ℹ️ Kayıt olabilmek için İK sisteminde kayıtlı <strong>SGK Numaranızı</strong> bilmeniz gerekmektedir.
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Kullanıcı Adı Belirleyin</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">SGK No (Doğrulama)</label>
                                <input
                                    type="text"
                                    value={sgkNo}
                                    onChange={(e) => setSgkNo(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Personel kartınızdaki numara"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Şifre</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <div className="text-xs text-rose-400 mt-2">{error}</div>}
                            {successMsg && <div className="text-xs text-emerald-400 mt-2">{successMsg}</div>}

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg mt-2 shadow-lg focus:ring-2 focus:ring-teal-500 transition-all"
                            >
                                KAYDI TAMAMLA
                            </button>
                            <button
                                type="button"
                                onClick={() => switchView('login')}
                                className="w-full py-2 px-4 text-slate-400 hover:text-white text-sm transition-colors"
                            >
                                Giriş Ekranına Dön
                            </button>
                        </form>
                    )}

                    {/* --- RECOVERY FORM --- */}
                    {view === 'recovery' && (
                         <form onSubmit={handleRecovery} className="space-y-4">
                            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-900/50 text-xs text-yellow-200 mb-4">
                                🔒 Güvenlik Doğrulaması: Şifrenizi sıfırlamak için Kullanıcı Adınızı ve SGK Numaranızı doğrulamanız gerekmektedir.
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">SGK No (Güvenlik Sorusu)</label>
                                <input
                                    type="text"
                                    value={sgkNo}
                                    onChange={(e) => setSgkNo(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        required
                                        placeholder="Yeni şifreniz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        required
                                        placeholder="Tekrar girin"
                                    />
                                </div>
                            </div>

                            {error && <div className="text-xs text-rose-400 mt-2">{error}</div>}
                            {successMsg && <div className="text-xs text-emerald-400 mt-2">{successMsg}</div>}

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg mt-2 shadow-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                ŞİFREYİ YENİLE
                            </button>
                            <button
                                type="button"
                                onClick={() => switchView('login')}
                                className="w-full py-2 px-4 text-slate-400 hover:text-white text-sm transition-colors"
                            >
                                Vazgeç
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                        <div className="text-xs text-slate-500 space-y-1">
                            <p>Demo Admin: admin / 1234</p>
                            <p>Demo Personel: ahmet / 1234 / SGK: 10909274686</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
