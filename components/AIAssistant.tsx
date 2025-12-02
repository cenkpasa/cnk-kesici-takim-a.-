
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseService } from '../services/databaseService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'analyze' | 'transcribe'>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            text: 'Merhaba! CNK İK Asistanı hizmetinizde. Size nasıl yardımcı olabilirim?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, activeTab]);

    const getContextData = () => {
        const allPersonnel = DatabaseService.getPersonnel();
        const today = new Date().toLocaleDateString('tr-TR');
        return {
            context: `
                Bugünün Tarihi: ${today}.
                Şirket: CNK Kesici Takımlar A.Ş.
                Genel Müdür: Cenk Dikmen.
                Personel Verisi: ${JSON.stringify(allPersonnel.map(p => ({
                    Ad: p.adSoyad, Gorev: p.gorevi, Maas: p.baseSalary, IseGiris: p.iseGirisTarihi, GirisCikisLoglari: p.timeLogs
                })))}
                
                SİSTEM TALİMATI:
                Sen bir İnsan Kaynakları Asistanısın. 
                Sana personel verileri ve günlük giriş çıkış logları verilecek.
                
                ÖNEMLİ: "Geç kalanları analiz et" veya "Kim geç kaldı" gibi sorular sorulursa:
                - Giriş saati 08:45'ten sonra olanları "GEÇ KALAN" olarak işaretle.
                - Eğer bir personel sürekli geç kalıyorsa (birden fazla gün), bunu "Sık sık geç kalıyor" olarak belirt.
                - Raporu kişi bazlı ve net bir dille sun.
            `
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !selectedImage) return;

        const userText = input;
        const userImg = selectedImage;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: userText + (userImg ? ' [Görsel Eklendi]' : ''),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            let responseText = '';

            if (activeTab === 'chat') {
                // THINKING MODE: gemini-3-pro-preview with thinkingBudget
                const { context } = getContextData();
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: userText + "\n\nCONTEXT: " + context,
                    config: {
                        thinkingConfig: { thinkingBudget: 32768 } 
                    }
                });
                responseText = response.text || 'Cevap alınamadı.';

            } else if (activeTab === 'search') {
                // SEARCH GROUNDING: gemini-2.5-flash with googleSearch
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userText,
                    config: {
                        tools: [{ googleSearch: {} }]
                    }
                });
                responseText = response.text || 'Arama sonucu bulunamadı.';
                // Append sources if available
                if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    const sources = response.candidates[0].groundingMetadata.groundingChunks
                        .map((c: any) => c.web?.uri).filter(Boolean).join('\n');
                    if (sources) responseText += `\n\nKaynaklar:\n${sources}`;
                }

            } else if (activeTab === 'analyze') {
                // IMAGE ANALYSIS: gemini-2.5-flash for faster, effective multimodal analysis
                if (!userImg) {
                    responseText = "Lütfen analiz için bir görsel yükleyin.";
                } else {
                    const base64Data = userImg.split(',')[1];
                    const mimeType = userImg.split(';')[0].split(':')[1];
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash', // Efficient for image tasks
                        contents: {
                            parts: [
                                { inlineData: { mimeType, data: base64Data } },
                                { text: userText || "Bu görseli detaylıca analiz et ve tanımla." }
                            ]
                        }
                    });
                    responseText = response.text || 'Görsel analiz edilemedi.';
                }
            } else if (activeTab === 'transcribe') {
                 // Handled in startRecording logic primarily, but if text is sent here with file...
                 responseText = "Lütfen mikrofon butonunu kullanın.";
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: new Date()
            }]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: 'Bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)),
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Audio Transcription Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' }); // Browser usually records in webm
                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    const rawBase64 = base64data.split(',')[1]; // Remove data:audio/webm;base64,
                    
                    setIsLoading(true);
                    try {
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: {
                                parts: [
                                    { inlineData: { mimeType: 'audio/webm', data: rawBase64 } },
                                    { text: "Lütfen bu ses kaydını metne dök (transcribe)." }
                                ]
                            }
                        });
                        
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'user',
                            text: '🎤 [Ses Kaydı Gönderildi]',
                            timestamp: new Date()
                        }, {
                            id: (Date.now() + 1).toString(),
                            role: 'model',
                            text: 'Transkripsiyon: ' + (response.text || 'Ses anlaşılamadı.'),
                            timestamp: new Date()
                        }]);
                    } catch (err) {
                        console.error(err);
                        alert("Ses işleme hatası.");
                    } finally {
                        setIsLoading(false);
                    }
                };
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("Mikrofon erişimi sağlanamadı.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                setSelectedImage(evt.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 border-2 border-white"
                title="AI Asistan"
            >
                <span className="text-2xl">✨</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border-2 border-indigo-600 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-2 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-sm">CNK AI Asistan</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">X</button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 text-xs border-b">
                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 ${activeTab === 'chat' ? 'bg-white font-bold border-t-2 border-indigo-600' : 'text-gray-600'}`}>Sohbet</button>
                <button onClick={() => setActiveTab('search')} className={`flex-1 py-2 ${activeTab === 'search' ? 'bg-white font-bold border-t-2 border-blue-600' : 'text-gray-600'}`}>Araştır</button>
                <button onClick={() => setActiveTab('analyze')} className={`flex-1 py-2 ${activeTab === 'analyze' ? 'bg-white font-bold border-t-2 border-green-600' : 'text-gray-600'}`}>Görsel</button>
                <button onClick={() => setActiveTab('transcribe')} className={`flex-1 py-2 ${activeTab === 'transcribe' ? 'bg-white font-bold border-t-2 border-red-600' : 'text-gray-600'}`}>Ses</button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50 space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap select-text ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="text-xs text-gray-500 italic ml-2">AI düşünüyor...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area based on Tab */}
            <div className="p-3 bg-white border-t border-gray-200">
                {activeTab === 'transcribe' ? (
                    <div className="flex justify-center">
                         {!isRecording ? (
                             <button onClick={startRecording} className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center hover:bg-red-200 transition-colors">
                                 <span className="text-2xl">🎤</span>
                             </button>
                         ) : (
                             <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-600 border-2 border-red-800 flex items-center justify-center animate-pulse text-white font-bold">
                                 DUR
                             </button>
                         )}
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                        {activeTab === 'analyze' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center gap-1">
                                        <span>📷</span> Görsel Seç
                                        <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                    </label>
                                    {selectedImage ? (
                                        <span className="text-xs text-green-600">Görsel Yüklendi ✓</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Lütfen bir resim seçin</span>
                                    )}
                                </div>
                                {selectedImage && (
                                    <div className="relative w-full h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
                                        <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            X
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                autoComplete="off"
                                placeholder={
                                    activeTab === 'search' ? 'Google\'da ara...' : 
                                    activeTab === 'analyze' ? 'Görsel hakkında sor...' : 
                                    'Sohbet et...'
                                }
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AIAssistant;
