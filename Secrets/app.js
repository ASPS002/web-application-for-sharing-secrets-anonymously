//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
var FacebookStrategy = require('passport-facebook')
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// const date = require(__dirname+"/date.js");// whatever is exported from the date module gets associated with date object


// console.log(new Date());
// const dates = [new Date(), new Date('August 19, 2021 23:15:30'),new Date('March 13, 2021 04:20')]
// dates.sort((date1,date2)=>(date2-date1));
// console.log(dates);

// { getDate: [Function: getDate], getDay: [Function: getDay] }
// const encrypt = require("mongoose-encryption");

// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({

    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String,
    isEmailVerified: Boolean,
    verificationToken: String,
    datePosted: Date

});


userSchema.plugin(passportLocalMongoose); // used to hash and salt our password and save users in mongodb database
userSchema.plugin(findOrCreate);
// console.log(process.env.secret)

// userSchema.plugin(encrypt, { secret: process.env.secret, encryptedFields: ['password'] });// we are encrypting only password because we will need email to search for a user in our database laterOn when logging  


const User = mongoose.model("User", userSchema);



passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// This line assumes that you have a User model defined in your application. The createStrategy() 
// method is typically used when working with a username and password-based authentication strategy, such as local authentication.

// . Serialization is the process of converting a user object into a format that can be stored in the session.

// Deserialization is the process of converting the serialized user object stored in the session back into a user object that can be used in the application.

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});






passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    scope: ["https://www.googleapis.com/auth/userinfo.email"],
    state: true,
},
    function (accessToken, refreshToken, profile, cb) {

        User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
            if (err) {
                console.log(err);
            } else {

                // console.log(profile);
                user.googleId = profile.id;
                user.isEmailVerified = true;
                user.save();
                return cb(err, user);
            }
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    scope: ['email'],

},
    function (accessToken, refreshToken, profile, cb) {

        User.findOrCreate({ facebookId: profile.id }, function (err, user) {

            user.isEmailVerified = true;
            user.save();
            return cb(err, user);
        });
    }
));


// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
    done(null, user)
})

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
    done(null, user)
})

app.get("/", function (req, res) {

    res.render("home");
});
app.get("/login", function (req, res) {

    res.render("login");
});
app.get("/register", function (req, res) {

    res.render("register");
});

app.get("/secrets", function (req, res) {


    // console.log(req.session);    // Session {
    //     cookie: { path: '/', _expires: null, originalMaxAge: null, httpOnly: true },
    //     passport: { user: 'user5@passportLocalMongoose.com' }
    //   }


    // console.log(req.user);  //   {
    //     _id: new ObjectId("648049ab2121f599d3649b09"),
    //     username: 'user5@passportLocalMongoose.com',
    //     __v: 0
    //   }

    if (req.isAuthenticated() && req.user.isEmailVerified) {
        User.find({ "secret": { $ne: null } }).then((foundUsers) => {

            if (foundUsers) {
                res.render("secrets", { foundUsers: foundUsers });//EJS
            } else {
                console.log("Users don't have any secrets");
            }
        }).catch((error) => {
            console.log(error);
        })
    } else {
        res.redirect("/login");
    }

});

app.get("/submit", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {

    const submittedSecret = req.body.secret;
    console.log(req.user);// passport saves user's details into request object

    User.findById(req.user._id).then((foundUser) => {

        if (foundUser) {
            foundUser.datePosted = new Date();
            foundUser.secret = submittedSecret;
            foundUser.save().then((result) => {
                res.redirect("/secrets");
            }).catch((error) => {
                console.log(error);
            })
        }
        else {
            console.log("User Not found and hence secret cannot be associated with the user");
        }
    }).catch((error) => {
        console.log(error);
    });



});

app.get("/logout", function (req, res) {
    req.logout(function (error) {
        if (error) {
            console.log(error);
            res.redirect("/secrets");
        } else {
            console.log("successully logged out");
            res.redirect("/");
        }
    });


});

app.post("/register", function (req, res) {


    //EMAIL VERIFICATION WITH PASSPORT LOCAL MONGOOSE

    User.findOne({ username: req.body.username }).then((user) => {

        if (user) {
            res.send("<h1>The given username already exists!</h1>");
        } else {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationLink = `http://localhost:3000/verify/${verificationToken}`;
            // console.log(req.body.username);
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: req.body.username,
                subject: 'Email Verification',
                html: `Please click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a>`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending verification email:', error);
                    // Handle error
                } else {
                    console.log('Verification email sent:', info.response);
                    User.register({ username: req.body.username }, req.body.password, function (error, user) {
                        if (error) {
                            console.log(error);
                            res.redirect("/register");
                        }
                        else {

                            passport.authenticate("local")(req, res, function () {// if a user gets authenticated, it is automatically redirected to secrets page

                                user.verificationToken = verificationToken;
                                user.save();
                                // console.log(user);
                                // console.log("kjjkj");
                                res.render("registration-successful");
                            });
                            // This middleware handles the authentication process, sets up the user object in the session, and triggers the callback 
                            // function when authentication is complete.
                        }
                    });
                    // Handle success
                }
            });
        }

    }).catch((error) => {

        console.log(error);
    });


    //PASSPORT LOCAL MONGOOSE

    // User.register({ username: req.body.username }, req.body.password, function (error, user) {
    //     if (error) {
    //         console.log(error);
    //         res.redirect("/register");
    //     }
    //     else {

    //         passport.authenticate("local")(req, res, function () {// if a user gets authenticated, it is automatically redirected to secrets page
    //             res.redirect("/secrets");
    //         });
    //         // This middleware handles the authentication process, sets up the user object in the session, and triggers the callback 
    //         // function when authentication is complete.
    //     }
    // });



    //AUTO  GENERATE A SALT AND HASH

    // bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    //     // Store hash in your password DB.
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save().then((result) => {
    //         res.render("secrets");// only render when user gets logged in
    //     }).catch((error) => {
    //         console.log(error);
    //     })

    // }).catch((error) => {
    //     console.log(error);
    // });


    //MD5

    // const newUser = new User({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });

    // newUser.save().then((result) => {
    //     res.render("secrets");// only render when user gets logged in
    // }).catch((error) => {
    //     console.log(error);
    // })

});


app.post("/login", function (req, res) {

    const email = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (error) {
        if (error) {
            console.log(error);
        } else {
            passport.authenticate("local")(req, res, function () {

                res.redirect("/secrets");
            });
        }
    });


    // User.findOne({ email: email }).then((foundUser) => {
    //     if (foundUser) {
    //         bcrypt.compare(password, foundUser.password).then((result)=>{

    //          if(result===true){
    //             res.render("secrets");
    //          } else {
    //             console.log("Password is not matched");
    //          }

    //         }).catch((error)=>{
    //             console.log(error);
    //         });
    //     }
    //     else {
    //         console.log("No such user exists");
    //     }
    // }).catch((error) => {
    //     console.log(error);
    // });

    // User.findOne({ email: email }).then((foundUser) => {
    //     if (foundUser) {
    //         if (md5(password) == foundUser.password) {
    //             res.render("secrets");
    //         }
    //         else {
    //             console.log("Password not matched");
    //         }
    //     }
    //     else {
    //         console.log("No such user exists");
    //     }
    // }).catch((error) => {
    //     console.log(error);
    // })

});

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // console.log(req.user);

        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });

app.get("/auth/google",
    passport.authenticate("google", { scope: ["https://www.googleapis.com/auth/userinfo.email"] }));

app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });


app.get("/auth/facebook",
    passport.authenticate("facebook"));

app.listen(3000, function () {
    console.log("Server started on port 3000");
});


app.get('/verify/:token', (req, res) => {
    const { token } = req.params;

    // Validate the token against the generated token in your database
    // console.log(token);

    User.findOne({ username: req.user.username }).then((userFound) => {
        if (userFound) {

            if (token === userFound.verificationToken) {
                userFound.isEmailVerified = true;
                userFound.save();
                res.redirect("/login");
            } else {
                res.send('Invalid verification token!');
            }
        }
    }).catch(error => {
        console.log("Unable to verify email " + error);
    })


});