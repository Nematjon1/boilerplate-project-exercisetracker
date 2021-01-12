'use strict';
require('dotenv').config();
const express = require('express');
const session = require("express-session");
const passport = require("passport");
const {MongoClient, ObjectID} = require("mongodb");
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const BCrypt = require("bcrypt");

const routes = require('./routes.js');
const auth = require("./auth.js");


const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug')

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());



myDB(async client => {
  const myDataBase = await client.db('fccAdvancedNode').collection('users');

  routes(app, myDataBase);
  auth(app, myDataBase)

  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + process.env.PORT || 3000)
})
