const express = require('express')
// const https = require('https')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
// const fs = require('fs')

const app = express()
// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/dees.kr/fullchain.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/dees.kr/privkey.pem')
// }

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

let clients = {}

wss.on('connection', (ws) => {
    let userId = null

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message)
        console.log('Message received on the server side.')

        if (parsedMessage.type === 'login') {
            userId = parsedMessage.id
            clients[userId] = ws
            broadcast({ type: 'system', message: `${userId} has joined the chat.` })
        } else if (parsedMessage.type === 'message' && userId) {
            broadcast({ type: 'message', id:userId, message: parsedMessage.message })
        }
    })

    ws.on('close', () => {
        if (userId) {
            delete clients[userId]
            broadcast({ type: 'system', message: `${userId} has left the chat.` })
        }
    })

    const broadcast = (data) => {
        const dataString = JSON.stringify(data)
        for (let clientId in clients) {
            if (clients[clientId].readyState === WebSocket.OPEN) {
                clients[clientId].send(dataString)
            }
        }
    }
})

app.use(express.static(path.join(__dirname, 'public')))

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is listening on https://localhost:3000')
})
