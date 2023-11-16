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
                console.log(base64QRCodeImage);

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

// Serve static files (including index.html)
app.use(express.static(path.join(__dirname, 'public')));

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
        QR Code Below <br><img src="data:image/png;base64,${base64QRCodeImage}" alt="QR Code">
        <br>
        <b>QR Code Base 64 String: </b>${base64QRCodeImage}
        <br>
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
    // // Access the incoming data sent in the POST request
    const incomingData = req.body;
    console.log('Incoming data:', incomingData);
    console.log('req:', req);

    const { type, whos, message } = req.body;

    if (type === 'text' && whos && message) {
        const remoteJid = whos;
        const textMessage = message;

        sock.sendMessage(remoteJid, { text: textMessage });
        console.log('Message sent to:', remoteJid);

        res.status(200).json({ status: 'success', message: 'Message sent.' });
    } else {
        res.status(400).json({ status: 'error', message: 'Invalid message format or missing data.' });
    }

    // // Set filepath for incoming data to be stored into .json file
    // const filePath = './allData.json';

    // // Check if the file exists, if not, create an empty array
    // if (!fs.existsSync(filePath)) {
    //     fs.writeFileSync(filePath, '[]');
    // }

    // // Read the existing data from the JSON file
    // const existingFile = JSON.parse(fs.readFileSync(filePath));

    // // Append the new data to the existing array
    // existingFile.push(incomingData);

    // // Write the data to a JSON file
    // fs.writeFile(filePath, JSON.stringify(existingFile, null, 2), err => {
    //     if (err) {
    //         console.error('Error writing to file:', err);
    //         res.status(500).send('Error saving data');
    //     } else {
    //         console.log('Data saved to file:', filePath);
    //         console.log('Received data: ' + JSON.stringify(incomingData, null, 2));
    //         const status = {
    //             log: 'done',
    //         };
    //         res.send(incomingData);
    //         res.status(200).json(status); // Send a JSON response
    //     }
    // });
});