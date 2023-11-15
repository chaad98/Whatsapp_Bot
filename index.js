//----- Imports -----//
const express = require('express');
const bodyParser = require('body-parser');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { Browsers } = require('@whiskeysockets/baileys');
const qrCode = require('qrcode'); // Import qrcode library


//----- Setting up Express -----//
const app = express();
app.use(bodyParser.json());


//----- Global Variables -----//
let qrCodeData = '';
let sock;


//----- API Routes -----//
app.get('/getQRCode', async (req, res) => {
    try {
        // Generate QR code image
        const pngBuffer = await qrCode.toBuffer(qrCodeData, { type: 'png' });

        // Convert the image buffer to base64
        const base64QRCodeImage = pngBuffer.toString('base64');

        // Construct HTML with an embedded image
        const htmlResponse = `<html><body>QR Code Below <br><img src="data:image/png;base64,${base64QRCodeImage}" alt="QR Code"></body></html>`;

        // Send the HTML response
        res.send(htmlResponse);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/sendMessage', (req, res) => {
    const { remoteJid, message } = req.body;

    if (remoteJid && message && sock) {
        sock.sendMessage(remoteJid, { text: message });
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'Invalid request body or sock is not initialized' });
    }
});


//----- WhatsApp API Setup -----//
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.ubuntu('Testing'),
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update || {};

        // update qr code
        if (qr) {
            qrCodeData = qr;

            // Convert the QR code data to base64 and perform any additional actions here
            console.log("QR Code Data: " + qrCodeData);
        }

        if (connection == 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode != DisconnectReason.loggedOut;
            console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connection opened');

            sock.ev.on('messages.upsert', (messageInfoUpsert) => {
                console.log(JSON.stringify(messageInfoUpsert, undefined, 2));

                const remoteJid = messageInfoUpsert.messages[0]?.key?.remoteJid;
                const fromMe = messageInfoUpsert.messages[0]?.key?.fromMe;

                if (remoteJid && !fromMe) {
                    console.log('Sending 10 seconds delay text messages');

                    setTimeout(() => {
                        sock.sendMessage(remoteJid, { text: 'This message from server WhatsApp Business' });
                        console.log('Delayed reply sent');
                    }, 10000);
                }
            });
        }

    });

    sock.ev.on('messages.update', (messageInfo) => {
        console.log(messageInfo);
    });

    sock.ev.on('creds.update', saveCreds);
}


//----- Execute WhatsApp API -----//
connectToWhatsApp();


//----- Server Start -----//
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
