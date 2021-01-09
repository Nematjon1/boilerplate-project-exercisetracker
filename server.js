const express = require('express')
const app = express()
const cors = require('cors');
const {MongoClient, ObjectID} = require("mongodb");
const bodyParser = require("body-parser");
require('dotenv').config();

let db;
let usersCollection;
// MongoDB connection
MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if(err) {
    console.log(err);
    return;
  } else {
    db = client.db();
    usersCollection = db.collection("users");
    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Your app is listening on port ' + listener.address().port)
    })
  }
});

app.use(cors())
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", function(req, res) {
  const newUser = req.body.username;
  if(typeof newUser !== "string" || newUser === "") {
    res.json({"error": "The username is invalid."});
  } else {
    let user;
    usersCollection.findOne({username: newUser}, (err, data) => {
      if(err) {
        res.status(500).json({"error": "Something went wrong, please try later."})
      } else if(data === null) {
        usersCollection.insertOne({username: newUser}, (err, data) => {
            if(err) {
                res.status(500).json({"error": "Something went wrong, please try later."})
            } else if(data) {
                const result = data.ops.map(item => {
                    return {
                    username: item.username,
                    _id: item._id
                    }
                })
                res.send(result[0]);
            }
        });
      } else {
        res.json({"error": "Username already taken."})
      }
    });

  }
});

app.get("/api/exercise/users", function(req, res) {
  db.collection("users").find({}).toArray((err, data) => {
    if(err) {
      res.json({"error": "Something went wrong, please try later."})
    } else {
      res.json(data);
    }
  })
});
