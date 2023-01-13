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

server.listen(5000, () =>{
    console.log('Sucesso')
})

server.post("/participants", (req, res) => {
    const {name} = req.body
    if(!name) return res.status(422)
    db.collection("participants").insertOne({name, lastStatus: Date.now()})
    res.sendStatus(201)
})

server.get("/participants", (req, res) => {
    db.collection("participants").find().toArray().then(users => {
        res.status(200).send(users)
    })
})

server.post("/messages", (req, res) => {
    const from = req.headers.user
    const {to, text, type} = req.body
    const time = dayjs().format('HH:mm:ss')
    console.log(from, to, text, type, time)
    if(!to || !text) return res.status(422)
    // db.collection("messages").insertOne({from, to, text, type, time})
    res.sendStatus(201)
})