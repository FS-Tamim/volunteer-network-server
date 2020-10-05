const express = require('express');
require('dotenv').config();
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');




var serviceAccount = require("./config/volunteer-network-4a048-firebase-adminsdk-taj4h-e65c09c48c.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer-network-4a048.firebaseio.com"
});

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2jpm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const eventCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COLL);
    const userEventCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION);
    console.log("database finally connected");

    app.post('/addActivity', (req, res) => {
        const event = req.body;
        eventCollection.insertOne(event)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })
    app.post('/addUserActivity', (req, res) => {
        const event = req.body;
        userEventCollection.insertOne(event)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/events', (req, res) => {
        eventCollection.find({})
            .toArray((err, document) => {
                res.send(document);

            })
    })
    app.get('/usersActivities', (req, res) => {
        userEventCollection.find({})
            .toArray((err, document) => {
                res.send(document);
            })
    })

    app.get('/activities', (req, res) => {

        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
                .then(function(decodedToken) {
                    let tokenEmail = decodedToken.email;
                    if (tokenEmail == req.query.email) {
                        userEventCollection.find({ email: req.query.email })
                            .toArray((err, document) => {
                                res.status(200).send(document);

                            })
                    } else {
                        res.status(401).send("un-authorised access");
                    }

                }).catch(function(error) {
                    res.status(401).send("un-authorised access")
                });
        } else {
            res.status(401).send("un-authorised access");
        }
    });
    app.delete('/activities/delete/:id', (req, res) => {
        userEventCollection.deleteOne({ _id: ObjectID(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0);
            })
    });

    app.delete('/usersActivities/delete/:id', (req, res) => {
        userEventCollection.deleteOne({ _id: ObjectID(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0);
            })
    });

});






app.get('/', function(req, res) {
    res.send('Server setup done!!!!!')
})







app.listen(process.env.PORT || 3003);