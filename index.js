const { DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");

const makeWASocket = require('@whiskeysockets/baileys').default;

async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state,
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

            // connections is reconnected
            if (shouldReconnect) {
                connectionLogic();
            }
        }
    });

    sock.ev.on("messages.update", (messageInfo) => {
        console.log(messageInfo);
    });

    sock.ev.on("messages.upsert", (messageInfoUpsert) => {
        console.log(messageInfoUpsert);
    });

    sock.ev.on ("creds.update", saveCreds)
}

connectionLogic();