var express = require('express');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var router = express.Router();
var https = require('https');
var util = require('util');

// In this example, the user's Facebook profile is supplied as the user record.  In a production-quality application, the Facebook profile should be associated with a user record in the application's database, which allows for account linking and authentication with other identity providers.


// In order to restore authentication state across HTTP requests, Passport needs to serialize users into and deserialize users out of the session. In a production-quality application, this would typically be as simple as supplying the user ID when serializing, and querying the user record by ID from the database when deserializing. However, due to the fact that this example does not have a database, the complete Twitter profile is serialized and deserialized. 

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

// Create a new Express application:
var app = express();

// Configure views engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Serve static directories for CSS, images, and javascript
app.use('/static', express.static(__dirname + '/stylesheets'));
app.use('/static', express.static(__dirname + '/js'));
app.use('/static', express.static(__dirname + '/images'));

// Use app-level middleware for common functionality, including logging, parsing, and session handling. 
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/', function (req, res) {
    res.render('home', { user: req.user });
});
app.get('/login', function (req, res) {
    res.render('login');
});

// Facebook Authentication Routes
app.get('/login/fb', passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));
app.get('/login/fb/callback', 
        passport.authenticate('facebook', { failureRedirect: '/login'}), 
        function (req, res) {
        res.redirect('/profile');
});
app.get('/profile',
       require('connect-ensure-login').ensureLoggedIn(),
       function (req, res) {
	console.log(req.user);
    res.render('profile', { user: req.user });
});

// Define FB API call functions
function getFriends(userId, accessToken, cb){
	var get_options = {
		host: 'graph.facebook.com',
		port: '443',
		path: '/v2.2/' + userId + '/friends',
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + accessToken,
		}
	};
	console.log(' $$$$$$$ GET THAT MONEY RIGHT $$$$$$$ ');
	console.log(get_options);
	
	var req = https.request(get_options, function (res) {
		console.log("/nstatus code: ", res.statusCode);
		res.on('data', function (data) {
			var jsonData = JSON.parse(data);
			console.log(jsonData);
			cb(jsonData);
		});
	});
	
	// End the request
	req.end();
	req.on('error', function (err) {
		console.log("Error: ", err);
	});
}

// Use Facebook Authentication Strategy from Passport

passport.use(new FacebookStrategy({
    clientID: '627987540704147',
    clientSecret: 'fb6d1d95a590c4213ab35ccd581c4f5a',
    callbackURL: 'http://localhost:3000/login/fb/callback'
}, function (accessToken, refreshToken, profile, cb) {
	console.log('accessToken = ' + accessToken);
	console.log('profile = ' + util.inspect(profile));
	getFriends(profile.id, accessToken, function(friends) {
		profile.friends = friends.data;
		return cb(null, profile);
	});
}));




app.listen(3000);


























