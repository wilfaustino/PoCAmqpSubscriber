const express = require('express')
const app = express()
const amqp = require('amqplib')

const hostname = '192.168.0.8'
const port = 5672
let rabbitAddress = { hostname, port }

if (process.env.RABBIT_PORT) {
    rabbitAddress = {...rabbitAddress, port: process.env.RABBIT_PORT }
}

if (process.env.RABBIT_HOST) {
    rabbitAddress = {...rabbitAddress, hostname: process.env.RABBIT_HOST }
}

const DEFAULT_PORT = 5000

app.get('/health', function (_, res) {
    res.send('ok')
})

app.get('/:queue/', function (req, res) {
    const { queue } = req.params

    const open = amqp.connect(rabbitAddress)
    open.then(conn => {
        return conn.createChannel()
    })
    .then(ch => {
        return ch.assertQueue(queue)
            .then(() => {
                return ch.consume(queue, function(msg) {
                    if (msg !== null) {
                        ch.ack(msg);
                        res.status(200).send(msg.content.toString())
                    }
                    res.status(200).send('empty')
                })
            })
            .then(() => {
                return ch.close()
            })
    })
    .catch(err => {
        res.status(500).send(`Error pushing to ${queue}. ${err}`)
    })
})

console.log(`Starting server on port ${process.env.PORT || DEFAULT_PORT}`)
app.listen(process.env.PORT || DEFAULT_PORT)
