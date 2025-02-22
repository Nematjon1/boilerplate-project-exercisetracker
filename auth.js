const passport = require("passport");
const LocalStrategy = require('passport-local');
const BCrypt = require("bcrypt");

module.exports = function(app, myDataBase) {
    // Serialization and deserialization here...
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });

    passport.use(new LocalStrategy(function(username, password, done) {
        myDataBase.findOne({ username: username }, function(err, user) {
            console.log('User ' + username + ' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!BCrypt.compareSync(password, user.password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
    ));
}
