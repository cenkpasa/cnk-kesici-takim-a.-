
import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';
import { User } from './types';
import { AppContext } from './contexts/AppContext';
import { DatabaseService } from './services/databaseService';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initializeApp = useCallback(() => {
        DatabaseService.initDB();
        // In a real app, you'd check for a session token here
        setIsLoading(false);
    }, []);

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        if (currentUser) {
            DatabaseService.logAction(currentUser.username, 'LOGOUT', 'System', 'User logged out');
        }

        if (currentUser?.role === 'admin') {
            if (window.confirm('Oturumu kapatırken veritabanının yedeğini indirmek ister misiniz? Bu, verilerinizin güvenliği için önerilir.')) {
                DatabaseService.triggerBackupDownload();
                DatabaseService.logAction(currentUser.username, 'IMPORT', 'Backup', 'Admin triggered backup on logout');
            }
        }
        setCurrentUser(null);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white">Yükleniyor...</div>;
    }

    return (
        <AppContext.Provider value={{ currentUser, login: handleLogin, logout: handleLogout }}>
            <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
                {currentUser ? <MainScreen /> : <LoginScreen />}
            </div>
        </AppContext.Provider>
    );
};

export default App;
