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
        let result = data.map(item => {
            return {
                _id: item._id,
                username: item.username
            }
        })
      res.json(result);
    }
  })
});

app.post("/api/exercise/add", function(req, res) {
    const {userId, description, duration, date} = req.body;

    if(!ObjectID.isValid(userId)) {
        res.json({"error": "Valid user ID required."})
    } else if(description.length === 0 || typeof description !== "string") {
        res.json({"error": "Description should be string and required"})
    } else if(!+duration) {
        res.json({"error": "Duration should be number and required"})
    } else if(date && new Date(date).toString() === "Invalid Date") {
        res.json({"error": "Date should be yyyy-mm-dd format"})
    } else {
        usersCollection.updateOne({_id: ObjectID(userId)},{$push: {
          log: {
              description: description.trim(),
              duration: +duration,
              date: date ? new Date(date) : new Date()
          }
        }},{upsert: true}, (err, data) => {
            if(err) {
                console.log("Update error: ", err);
                res.json({"error": "Update error"})
            } else if(data) {
                usersCollection.find({_id: ObjectID(userId)}).toArray((err, data) => {
                    if(err) {
                        res.json({"error": "Could not found"})
                    } else if(data) {  
                        console.log("Find: ", data)              
                        res.json({
                            username: data[0].username,
                            description: description.trim(),
                            duration: +duration,
                            _id: data[0]._id,
                            date: date ? new Date(date).toGMTString() : new Date().toGMTString()
                        })
                    }
                })
            }
        } )
    }

});

app.get("/api/exercise/log", function(req, res) {
    const {userId, from, to, limit} = req.query;
    if(!ObjectID.isValid(userId)) {
        res.json({"error": "Invalid user ID"})
    } else if((from && new Date(from).toString() === "Invalid Date") || to && new Date(to).toString() === "Invalid Date") {
        res.json({"error": "Invalid from/to date"});
    } else if(limit && !+limit) {
        res.json({"error": "Invalid limit value"});
    } else {
        usersCollection.find({_id: ObjectID(userId)}).toArray((err, data) => {
            if(err) {
                res.json({"error": "Internal error, please try later"});
            } else if(data) {
                let result = data.reduce((acc, item, idx) => {
                    let logs = item.log;
                    console.log(item);
                    if ((from && new Date(from).toString() !== "Invalid Date")
                    ) {
                        logs = item.log.filter(l => {
                            return l.date >= new Date(from).getTime();
                        });
                    }
                    if ((from && new Date(from).toString() !== "Invalid Date")
                    ) {
                        logs = item.log.filter(l => {
                            return l.date <= new Date(to).getTime();
                        });
                    }
                    if (limit && !!+limit) {
                        logs = logs.filter((i, idx) => {
                            return idx < limit
                        })
                    }

                    let fr = from && new Date(from).toGMTString();
                    let t = to && new Date(to).toGMTString();
                    return {
                        username: item.username,
                        log: logs,
                        count: logs.length,
                        _id: item._id,
                        from: fr && fr,
                        to: t && t
                    }
                }, {});
                console.log("Result: ", result);
                res.json(result);
            }
        })
    }
});
