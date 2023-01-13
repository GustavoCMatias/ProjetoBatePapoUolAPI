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
    if (!name) return res.sendStatus(422)
    try {
        const nameCheck = await db.collection("participants").findOne({ name })
        if (nameCheck) return res.sendStatus(409)


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

server.post("/messages", async (req, res) => {
    const from = req.headers.user
    const { to, text, type } = req.body
    const time = dayjs().format('HH:mm:ss')

    try {
        const var1 = !to || !text 
        const var2 = type !== 'message' && type !== 'private_message' 
        const var3 = await db.collection("participants").findOne({ name: from }) 
        if (var1 || var2 || !var3) return res.sendStatus(422)

        db.collection("messages").insertOne({ from, to, text, type, time })
        res.sendStatus(201)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

server.get("/messages", async (req, res) => {

    const user = req.headers.user
    const limit = req.query.limit
    if(limit<=0||typeof(limit === 'string')) res.sendStatus(422)
    try {
        const msgs = await db.collection("messages").find().toArray()

        let msgsFiltered

        if (limit) {
            msgsFiltered = msgs.filter(each => each.type === 'message'|| each.type === 'status' || each.to === user || each.from === user).slice(-limit)
        } else {
            msgsFiltered = msgs.filter(each => each.type === 'message'|| each.type === 'status' || each.to === user || each.from === user)
        }

        res.status(200).send(msgsFiltered)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

server.post("/status", async (req, res) => {
    const user = req.headers.user
    try {
        const id = await db.collection("participants").findOne({ name: user })
        if (!id) {
            return res.sendStatus(404)
        }
        res.status(200).send(id)
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

async function removeInactive() {
    try {
        const participants = await db.collection("paticipants").find().toArray()
        const now = Date.now()
        participants.forEach(async each => {
            if (now - each.lastStatus > 10000) {
                await db.collection("paticipants").delete({_id: each._id})   //TODO: Precisa de object id?
                const time = dayjs().format('HH:mm:ss')
                await db.collection("messages".insertOne({from: each.user, to: 'Todos', text: 'sai da sala...', type: 'status', time}))
            }
        })
    } catch (err) {
        return res.status(500).send(err.message);
    }
}