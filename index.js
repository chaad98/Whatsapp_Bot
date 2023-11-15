//----- Imports -----//
const express = require('express');
const bodyParser = require('body-parser');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { Browsers } = require('@whiskeysockets/baileys');
const qrCode = require('qrcode'); // Import qrcode library
const axios = require('axios');


//----- Setting up Express -----//
const app = express();
app.use(bodyParser.json());


//----- Global Variables -----//
let qrCodeData = '';
let sock;


//----- WhatsApp API Setup -----//
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: ["Baileys NodeJS"],
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update || {};

        // Delay for 8 seconds
        setTimeout(async () => {
            // update qr code
            if (qr) {
                qrCodeData = qr;

                // Convert the QR code data to base64
                const pngBuffer = await qrCode.toBuffer(qrCodeData, { type: 'png' });
                const base64QRCodeImage = pngBuffer.toString('base64');

                try {
                    // Make an HTTP POST request to the API with the base64QRCodeImage in the request body
                    const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
                    const apiResponse = await axios.post(apiEndpoint, {
                        base64QRCodeImage: base64QRCodeImage
                    });

                    // Log the response from the API
                    console.log('API Response:', apiResponse.data);
                    console.log(base64QRCodeImage);
                } catch (error) {
                    console.error('Error making API request:', error);
                }
            }
        });

        if (connection == 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode != DisconnectReason.loggedOut;
            console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } 
        else if (connection === 'open') {
            console.log('Connection opened');
        
            sock.ev.on('messages.upsert', async (messageInfoUpsert) => {
                console.log(JSON.stringify(messageInfoUpsert, undefined, 2));
        
                const messageText = messageInfoUpsert;

                const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
                axios.post(apiEndpoint, {
                    //fromJid: remoteJid
                    message: messageText
                }).then(apiResponse => {
                    console.log('API Response:', apiResponse.data);
                    console.log('Data: ', messageText);
                }).catch(error => {
                    console.error('Error making API request:', error);
                });
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