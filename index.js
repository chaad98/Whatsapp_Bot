const { DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");

const makeWASocket = require('@whiskeysockets/baileys').default;

const {
    Browsers,
  } = require("@whiskeysockets/baileys");

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.ubuntu("Testing"),
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update || {};

        // update qr code
        if (qr) {
            console.log(qr);
        }

        // connection is close
        if (connection == "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode != DisconnectReason.loggedOut;
            console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            // connections is reconnected
            if (shouldReconnect) {
                connectToWhatsApp();
            }

        } else if (connection === "open") {
            console.log("Connection opened");

            sock.ev.on("messages.upsert", (messageInfoUpsert) => {
                console.log(JSON.stringify(messageInfoUpsert, undefined, 2));
            
                // Example: reply to the first message from someone else with "Hello there!"
                const remoteJid = messageInfoUpsert.messages[0]?.key?.remoteJid;
                const fromMe = messageInfoUpsert.messages[0]?.key?.fromMe;
            
                if (remoteJid && !fromMe) {
                    sock.sendMessage(remoteJid, { text: 'This message from server WhatsApp Business' });
                }
            });
        }
    });

    sock.ev.on("messages.update", (messageInfo) => {
        console.log(messageInfo);
    });

    sock.ev.on ("creds.update", saveCreds)
}

connectToWhatsApp();