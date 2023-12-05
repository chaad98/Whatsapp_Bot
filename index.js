//----- Imports -----//
const express = require('express');
const bodyParser = require('body-parser');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const qrCode = require('qrcode'); // Import qrcode library
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

//----- Setting up Express -----//
const app = express();
app.use(bodyParser.json());


//----- Global Variables -----//
let qrCodeData = '';
let sock;
let ip_info = ['::ffff:127.0.0.1'];

//----- Execute WhatsApp API -----//
connectToWhatsApp();

//----- Server Start -----//
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // console.log(`Server is running on port ${PORT}`);
});

//----- Functions -----//
function generateRandomToken(length) {
    return crypto.randomBytes(length).toString('hex');
}

async function sendQRCodeImage() {
    const pngBuffer = await qrCode.toBuffer(qrCodeData, { type: 'png' });
    const base64QRCodeImage = pngBuffer.toString('base64');
    return base64QRCodeImage;
}

async function sendMessageWithType(type, whos, message) {
    // const remoteJid = whos;

    switch(type) {
        case 'text':
            if(message) {
                await sock.sendMessage(whos, { text: message });
                // console.log('Text message sent to:', whos);
            }
            break;

        case 'image':
            if(message && message.imageUrl) {
                const imageUrl = message.imageUrl;
                const caption = message.caption || '';

                await sock.sendMessage(whos, { image: {url: imageUrl}, caption: caption, });
                // console.log('Image message sent to:', whos);
            }
            break;
        
        case 'video':
            if(message && message.videoUrl) {
                const videoUrl = message.videoUrl;
                const caption = message.caption || '';

                await sock.sendMessage(whos, { video: {url: videoUrl}, caption: caption, });
                // console.log('Video message sent to:', whos);
            }
            break;
        
        case 'audio':
            if(message && message.audioUrl) {
                const audioUrl = message.audioUrl;

                await sock.sendMessage(whos, { audio: {url: audioUrl}, mimetype: 'audio/mp4', });
                // console.log('Audio message sent to:', whos);
            }
            break;

        case 'voice':
            if(message && message.audioFilePath) {
                const audioFilePath = message.audioFilePath;

                const audioData = fs.readFileSync(audioFilePath);

                await sock.sendMessage(whos, { audio: audioData, mimetype: 'audio/ogg; codecs=opus' })
                console.log('Voice message:', audioData);
            }
            break;
        
        case 'location':
            if(message && message.latitude && message.longitude) {
                const latitude = message.latitude;
                const longitude = message.longitude;

                await sock.sendMessage(whos, { location: {degreesLatitude: latitude, degreesLongitude: longitude}, });
                // console.log('Location message sent to:', whos);
            }
            break;

        // case 'link':
        //     if(message && message.link) {
        //         const link = message.link;

        //         await sock.sendMessage(whos, { text: `Hi, this was sent using ${link}`, });
        //         console.log('Link preview sent to:', whos);
        //     }
        //     break;

        case 'sticker':
            if(message && message.stickerUrl) {
                const stickerUrl = message.stickerUrl;

                await sock.sendMessage(whos, { sticker: {url: stickerUrl, }, });
                // console.log('Sticker sent to:', whos);
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
        
                await sock.sendMessage(whos, {
                    document: { url: documentFilePath, filename: fileOfName, filecaption: fileCaption, mimeType: mimeType },
                    ...info
                });
                // console.log('Document sent to:', whos);
            }
            break;
            

        case 'contact':
            if(message && message.displayName && message.phoneNumber) {
                const displayName = message.displayName;
                const phoneNumber = message.phoneNumber;
                const vcard = `BEGIN:VCARD\n` + `VERSION:3.0\n` + `FN:${displayName}\n` 
                                + `TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}\n` + `END:VCARD`;

                await sock.sendMessage(whos, { contacts: {displayName: displayName, contacts: [{vcard}] }, });
                // console.log('Contact sent to:', whos);
            }
            break;

        default:
            // console.error('Invalid message type');
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
                    // console.log('API Response:', apiResponse.data);
                    // console.log('QR Code Base64 String:',base64QRCodeImage);
                } catch (error) {
                    console.error('Error making API request:', error);
                }
            }
        });

        if (connection == 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode != DisconnectReason.loggedOut;
            // console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
            else {
                try {
                    fs.rmdirSync('auth_info_baileys', { recursive: true });
                    connectToWhatsApp();
                    // console.log('Authentication info folder deleted.');
                } catch (error) {
                    console.error('Error deleted authentication folder:', error);
                }
            }
        } 
        else if (connection === 'open') {
            // console.log('Connection opened');
        
            sock.ev.on('messages.upsert', async (messageInfoUpsert) => {
                // console.log(JSON.stringify(messageInfoUpsert, undefined, 2));
        
                const messageText = messageInfoUpsert;

                const apiEndpoint = 'https://www.api-controller.com/api/whatsapp_qr_api.php';
                axios.post(apiEndpoint, {
                    //fromJid: remoteJid
                    message: messageText
                }).then(apiResponse => {
                    // console.log('API Response:', apiResponse.data);
                    // console.log('Data: ', messageText);

                    if (apiResponse.data.log == 'done'){
                        // console.log('Success send to API', apiResponse.data.log);
                    }
                    else {
                        // console.log('Fail send to the API', apiResponse.data.log);
                    }
                }).catch(error => {
                    console.error('Error making API request:', error);
                });
            });
        }
    });

    sock.ev.on('messages.update', (messageInfo) => {
        // console.log(messageInfo);
    });

    sock.ev.on('creds.update', saveCreds);
}

//----- API Routes -----//
app.get('/checkIP', (req, res) => {
    const clientIP = req.ip;
    // console.log('Client IP:', clientIP);

    try {
        if(ip_info.includes(clientIP)) {
            // console.log('Matching IP Address found in ip_info array!');
            res.status(200).json({ success: true, message: 'IP Found success!' });
        } else {
            // console.log('No matching IP Address found in ip_info array!');
            res.status(403).json({ success: false, message: 'Invalid IP Address!', clientIP });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/getQRCode', async (req, res) => {
    const clientIP = req.ip;
    // console.log('Client IP:', clientIP);

    try {
        if (ip_info.includes(clientIP)) {
            const token = generateRandomToken(20);
            // console.log("Generated token:", token);

            const base64QRCodeImage  = await sendQRCodeImage();
            
            res.status(200).json({ success: true, message: 'Base64 String QR Code have been sent!'});
        } else {
            // console.log('IP not allowed to generate QR code');
            res.status(403).json({ success: false, message: 'Access denied for generating QR Code!' });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/sendMessage', async (req, res) => {
    const clientIP = req.ip;
    // console.log('Client IP:', clientIP);

    const { type, whos, message } = req.body;

    try {
        if (ip_info.includes(clientIP)) {
            await sendMessageWithType(type, whos, message);
            res.status(200).json({ status: 'success', message: 'Message sent!' });
        } else {
            // console.log('Client IP not allowed to send message');
            res.status(403).json({ status: 'success', message: 'Send message denied!' });
        }
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});