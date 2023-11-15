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


//----- API Routes -----//
// app.post('/sendQRCode', async (req, res) => {
//     try {
//         // Generate QR code image
//         const pngBuffer = await qrCode.toBuffer(qrCodeData, { type: 'png' });

//         // Convert the image buffer to base64
//         const base64QRCodeImage = pngBuffer.toString('base64');

//         // Make an HTTP POST request to the API with the base64QRCodeImage in the request body
//         const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
//         const apiResponse = await axios.post(apiEndpoint, {
//             base64QRCodeImage: base64QRCodeImage
//         });

//         // Log the response from the API
//         console.log('API Response:', apiResponse.data);

//         // Send the HTML response
//         res.send(base64QRCodeImage);
//         console.log(`Base 64 String image converted: ${base64QRCodeImage}`);
//     } catch (error) {
//         console.error('Error generating QR code or making API request:', error);
//         res.status(500).json({ success: false, error: 'Internal Server Error' });
//     }
// })

// app.get('/getMessage', (req, res) => {
//     const remoteJid = req.query.remoteJid;
//     const message = req.query.message;

//     if (remoteJid && message && sock) {
//         sock.sendMessage(remoteJid, { text: message });

//         // Make an HTTP POST request to the API with the message details
//         const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
//         axios.post(apiEndpoint, {
//             fromJid: remoteJid,  // Only send the fromJid data to the API
//             message: message
//         }).then(apiResponse => {
//             // Log the response from the API
//             console.log('API Response:', apiResponse.data);
//         }).catch(error => {
//             console.error('Error making API request:', error);
//         });

//         res.json({ success: true });
//     } else {
//         res.status(400).json({ success: false, error: 'Invalid request parameters or sock is not initialized' });
//     }
// });

// app.post('/sendMessage', (req, res) => {
//     const { remoteJid, message } = req.body;

//     if (remoteJid && message && sock) {
//         sock.sendMessage(remoteJid, { text: message });
//         res.json({ success: true });
//     } else {
//         res.status(400).json({ success: false, error: 'Invalid request body or sock is not initialized' });
//     }
// });


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

            // // Additional actions if needed
            // console.log("QR Code Data: " + qrCodeData);
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

            sock.ev.on('messages.upsert', (messageInfoUpsert) => {
                console.log(JSON.stringify(messageInfoUpsert, undefined, 2));

                const remoteJid = messageInfoUpsert.messages[0]?.key?.remoteJid;
                const fromMe = messageInfoUpsert.messages[0]?.key?.fromMe;

                if (remoteJid && !fromMe) {
                    const messageText = messageInfoUpsert.messages[0]?.message?.conversation;
        
                    if (messageText) {
                        console.log(`Received message: ${messageText}`);
        
                        // Make an HTTP POST request to the API with the message text
                        const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
                        axios.post(apiEndpoint, {
                            fromJid: remoteJid,
                            message: messageText
                        }).then(apiResponse => {
                            // Log the response from the API
                            console.log('API Response:', apiResponse.data);
                        }).catch(error => {
                            console.error('Error making API request:', error);
                        });
                    }

                    // if (remoteJid && !fromMe) {
                    //     console.log('Sending 10 seconds delay text messages');
    
                    //     setTimeout(() => {
                    //         sock.sendMessage(remoteJid, { text: 'This message from server WhatsApp Business' });
                    //         console.log('Delayed reply sent');
                    //     }, 10000);
                    // }
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
