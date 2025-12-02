
const WebSocket = require('ws');
const net = require('net');

const WS_PORT = 8080;
let wss;

function startWebSocketServer() {
    wss = new WebSocket.Server({ port: WS_PORT });

    console.log('---------------------------------------------------------');
    console.log('Personel Takip - Cihaz Bağlantı Köprüsü (Proxy Server)');
    console.log('---------------------------------------------------------');
    console.log(`Durum: Çalışıyor (Port: ${WS_PORT})`);
    console.log('Bekleniyor: Web arayüzünden bağlantı...');

    wss.on('connection', ws => {
        console.log('>> Web arayüzü bağlandı.');
        let deviceSocket = null;
        let isDeviceConnected = false;

        ws.on('message', message => {
            try {
                const data = JSON.parse(message);

                // CİHAZA BAĞLANMA İSTEĞİ
                if (data.command === 'CONNECT') {
                    if (deviceSocket) {
                        deviceSocket.destroy();
                    }

                    console.log(`>> Cihaza bağlanılıyor: ${data.ip}:${data.port}...`);
                    
                    deviceSocket = new net.Socket();
                    
                    // Bağlantı zaman aşımı ve hata yönetimi
                    deviceSocket.setTimeout(5000);
                    
                    deviceSocket.connect(parseInt(data.port), data.ip, () => {
                        console.log('<< Cihaz bağlantısı BAŞARILI.');
                        isDeviceConnected = true;
                        ws.send(JSON.stringify({ type: 'STATUS', status: 'CONNECTED' }));
                    });

                    deviceSocket.on('data', chunk => {
                        console.log(`<< Veri alındı (${chunk.length} byte)`);
                        ws.send(JSON.stringify({ 
                            type: 'DATA', 
                            data: chunk.toString('base64'), 
                            raw: chunk.toString('utf-8')    
                        }));
                    });

                    deviceSocket.on('close', () => {
                        if (isDeviceConnected) {
                            console.log('<< Cihaz bağlantısı koptu.');
                            ws.send(JSON.stringify({ type: 'STATUS', status: 'DISCONNECTED' }));
                        }
                        isDeviceConnected = false;
                    });

                    deviceSocket.on('error', err => {
                        console.error('!! Cihaz hatası:', err.message);
                        ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
                        isDeviceConnected = false;
                    });

                    deviceSocket.on('timeout', () => {
                        console.error('!! Cihaz bağlantısı zaman aşımı.');
                        deviceSocket.destroy();
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Bağlantı zaman aşımı' }));
                        isDeviceConnected = false;
                    });
                }

                // VERİ GÖNDERME İSTEĞİ
                if (data.command === 'SEND') {
                    if (deviceSocket && !deviceSocket.destroyed) {
                        console.log('>> Cihaza komut gönderiliyor...');
                        deviceSocket.write(data.payload); 
                    } else {
                        ws.send(JSON.stringify({ type: 'ERROR', message: 'Cihaz bağlı değil.' }));
                    }
                }

                // BAĞLANTIYI KESME
                if (data.command === 'DISCONNECT') {
                    if (deviceSocket) {
                        deviceSocket.destroy();
                        deviceSocket = null;
                    }
                    isDeviceConnected = false;
                    ws.send(JSON.stringify({ type: 'STATUS', status: 'DISCONNECTED' }));
                }

            } catch (e) {
                console.error('Mesaj işleme hatası:', e);
            }
        });

        ws.on('close', () => {
            console.log('>> Web arayüzü ayrıldı.');
            if (deviceSocket) {
                deviceSocket.destroy();
            }
        });
    });

    wss.on('error', (error) => {
        console.error('WebSocket Sunucu Hatası:', error);
        setTimeout(startWebSocketServer, 5000); // 5 saniye sonra yeniden başlatmayı dene
    });
}

startWebSocketServer();
