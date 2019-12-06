const express = require('express')
const app = express()
const amqp = require('amqplib')

const RABBIT_DEFAULT_URL = 'amqp://127.0.0.1'
const DEFAULT_PORT = 5000

app.get('/health', function (_, res) {
    res.send('ok')
})

app.get('/:queue/', function (req, res) {
    const { queue } = req.params

    const open = amqp.connect(process.env.RABBIT_URL || RABBIT_DEFAULT_URL)
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
    })
    .catch(err => {
        res.status(500).send(`Error pushing to ${queue}. ${err}`)
    })
})

console.log(`Starting server on port ${process.env.PORT || DEFAULT_PORT}`)
app.listen(process.env.PORT || DEFAULT_PORT)