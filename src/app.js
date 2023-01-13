import express from 'express'
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from "mongodb";
import dayjs from "dayjs"
dotenv.config();

const server = express();
server.use(cors())
server.use(express.json())

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db


mongoClient.connect()
    .then(() => {
        db = mongoClient.db()
    })
    .catch(() => {
        console.log('deu ruim')
    })

server.listen(5000, () => {
    console.log('Sucesso')
})

server.post("/participants", async (req, res) => {
    const { name } = req.body
    if (!name) return res.status(422)
    try {
        const nameCheck = await db.collection("participants").findOne({ name })
        if (nameCheck) return res.status(409)


        const time = dayjs().format('HH:mm:ss')
        db.collection("participants").insertOne({ name, lastStatus: Date.now() })
        db.collection("messages").insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time })
        res.sendStatus(201)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

server.get("/participants", (req, res) => {
    db.collection("participants").find().toArray().then(users => {
        res.status(200).send(users)
    })
})

server.post("/messages", (req, res) => {
    const from = req.headers.user
    const { to, text, type } = req.body
    const time = dayjs().format('HH:mm:ss')
    console.log(from, to, text, type, time)

    try {
        const var1 = !to || !text
        const var2 = type !== 'message' && type !== 'private_message'
        const var3 = db.collection("participants").find({ name: from })
        if (!var1 || !var2 || !var3) return res.status(422)

        db.collection("messages").insertOne({ from, to, text, type, time })
        res.sendStatus(201)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

server.get("/messages", async (req, res) => {

    const user = req.headers.user
    const limit = req.query.limit
    try {
        const msgs = await db.collection("messages").find().toArray()

        if (limit) {
            const msgsFiltered = msgs.filter(each => { each.type === message || each.to === user }).slice(-limit)
        } else {
            const msgsFiltered = msgs.filter(each => { each.type === message || each.to === user })
        }

        res.status(200).send(msgsFiltered)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

server.post("/status", async(req, res) => {
    const user = req.headers.user
    const id = await db.collection("participants").findOne({name: user})
    res.status(200).send(id)
})