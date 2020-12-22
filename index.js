const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.atcbg.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()
app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/burj-al-arab-1-cfda5-firebase-adminsdk-s0ohz-e2a3c7592d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});
const port = 5000

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db("brujAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body
    productCollection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking);

  })

  app.get('/booking', (req, res) => {


    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail === queryEmail) {

            productCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })

          }
          else{
            res.status(401).send('un-authorized access')
          }

        })
        .catch((error) => {
          res.status(401).send('un-authorized access') 

        });
    }
    else{
      res.status(401).send('un-authorized access')
    }



  })

  console.log('database connected')
});


app.listen(port);