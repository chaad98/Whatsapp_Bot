//----- Imports -----//
const express = require('express');
const bodyParser = require('body-parser');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { Browsers } = require('@whiskeysockets/baileys');
const qrCode = require('qrcode'); // Import qrcode library
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Mimetype } = require('@whiskeysockets/baileys');

//----- Setting up Express -----//
const app = express();
app.use(bodyParser.json());


//----- Global Variables -----//
let qrCodeData = '';
let sock;

//----- Functions -----//
async function sendQRCodeImage(whos, qrData) {
    try {
        const pngBuffer = await qrCode.toBuffer(qrData, { type: 'png', });
        const base64QRCodeImage = pngBuffer.toString('base64');

        await sock.sendMessage(whos, { image: {url: `data:image/png;base64,${base64QRCodeImage}` }, });

        console.log('QR Code sent to:', whos);
        return { success: true, message: 'QR Code sent.' };
    } catch (error) {
        console.error('Error generating or sending QR code:', error);
        return { success: false, message: 'Error generating or sending QR code.'};
    }
}

async function sendMessageWithType(type, whos, message) {
    const remoteJid = whos;

    switch(type) {
        case 'text':
            if(message) {
                await sock.sendMessage(remoteJid, { text: message });
                console.log('Text message sent to:', remoteJid);
            }
            break;

        case 'image':
            if(message && message.imageUrl) {
                const imageUrl = message.imageUrl;
                const caption = message.caption || '';

                await sock.sendMessage(remoteJid, { image: {url: imageUrl}, caption: caption, });
                console.log('Image message sent to:', remoteJid);
            }
            break;
        
        case 'video':
            if(message && message.videoUrl) {
                const videoUrl = message.videoUrl;
                const caption = message.caption || '';

                await sock.sendMessage(remoteJid, { video: {url: videoUrl}, caption: caption, });
                console.log('Video message sent to:', remoteJid);
            }
            break;
        
        case 'audio':
            if(message && message.audioUrl) {
                const audioUrl = message.audioUrl;

                await sock.sendMessage(remoteJid, { audio: {url: audioUrl}, mimetype: 'audio/mp4', });
                console.log('Audio message sent to:', remoteJid);
            }
            break;
        
        case 'location':
            if(message && message.latitude && message.longitude) {
                const latitude = message.latitude;
                const longitude = message.longitude;

                await sock.sendMessage(remoteJid, { location: {degreesLatitude: latitude, degreesLongitude: longitude}, });
                console.log('Location message sent to:', remoteJid);
            }
            break;

        case 'link':
            if(message && message.link) {
                const link = message.link;

                await sock.sendMessage(remoteJid, { text: `Hi, this was sent using ${link}`, });
                console.log('Link preview sent to:', remoteJid);
            }
            break;

        case 'sticker':
            if(message && message.stickerUrl) {
                const stickerUrl = message.stickerUrl;

                await sock.sendMessage(remoteJid, { sticker: {url: stickerUrl, }, });
                console.log('Sticker sent to:', remoteJid);
            }
            break;

        case 'document':
            if (message && message.filePath && message.fileName && message.filecaption && message.mimetype) {
                const documentFilePath = message.filePath;
                const fileOfName = message.fileName;
                const fileCaption = message.filecaption;
                const mimeType = message.mimetype;
                // console.log('This file name', fileOfName);

                let info = {};
        
                switch (mimeType) {
                    case 'word':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/msword',
                        };
                        break;

                    case 'word365':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        };
                        break;

                    case 'pdf':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/pdf',
                        };
                        break;

                    case 'excel':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.ms-excel',
                        };
                        break;

                    case 'excel365':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        };
                        break;

                    case 'powerpoint':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.ms-powerpoint',
                        };
                        break;

                    case 'powerpoint365':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        };
                        break;

                    case 'txt':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'text/plain',
                        };
                        break;

                    case 'rtf':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/rtf',
                        };
                        break;

                    case 'zip':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/zip',
                        };
                        break;

                    case 'rar':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'application/vnd.rar',
                        };
                        break;

                    case 'jpg':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'image/jpeg',
                        };
                        break;

                    case 'png':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'image/png',
                        };
                        break;

                    case 'gif':
                        info = {
                            filePath: documentFilePath,
                            fileName: fileOfName,
                            caption: fileCaption,
                            mimetype: 'image/gif',
                        };
                        break;

                    default:
                        console.error('Unsupported document type');
                        break;
                }
        
                await sock.sendMessage(remoteJid, {
                    document: { url: documentFilePath, filename: fileOfName, filecaption: fileCaption, mimeType: mimeType },
                    ...info
                });
                console.log('Document sent to:', remoteJid);
            }
            break;
            

        case 'contact':
            if(message && message.displayName && message.phoneNumber) {
                const displayName = message.displayName;
                const phoneNumber = message.phoneNumber;
                const vcard = `BEGIN:VCARD\n` + `VERSION:3.0\n` + `FN:${displayName}\n` 
                                + `TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}\n` + `END:VCARD`;

                await sock.sendMessage(remoteJid, { contacts: {displayName: displayName, contacts: [{vcard}] }, });
                console.log('Contact sent to:', remoteJid);
            }
            break;

        default:
            console.error('Invalid message type');
            throw new Error('Invalid message type');
    }
}


//----- WhatsApp API Setup -----//
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: ["Testing"],
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
                    console.log('QR Code Base64 String:',base64QRCodeImage);
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
            else {
                try {
                    fs.rmdirSync('auth_info_baileys', { recursive: true });
                    connectToWhatsApp();
                    console.log('Authentication info folder deleted.');
                } catch (error) {
                    console.error('Error deleted authentication folder:', error);
                }
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
                    // console.log('Data: ', messageText);

                    if (apiResponse.data.log == 'done'){
                        console.log('Success send to API', apiResponse.data.log);
                    }
                    else {
                        console.log('Fail send to the API', apiResponse.data.log);
                    }
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

//----- API Routes -----//
app.get('/getQRCode', async (req, res) => {
    try {
        // Generate QR code image
        const pngBuffer = await qrCode.toBuffer(qrCodeData, { type: 'png' });

        // Convert the image buffer to base64
        const base64QRCodeImage = pngBuffer.toString('base64');

        // Construct HTML with an embedded image
        const htmlResponse = `
        <html>
        <body>
        <img src="data:image/png;base64,${base64QRCodeImage}" alt="QR Code">
        </body>
        </html>`;

        // Send the HTML response
        res.send(htmlResponse);
        // res.send(base64QRCodeImage);
        console.log('Image Data:', base64QRCodeImage);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/sendMessage', async (req, res) => {
    const { type, whos, message } = req.body;

    try {
        await sendMessageWithType(type, whos, message);
        res.status(200).json({ status: 'success', message: 'Message sent.' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});