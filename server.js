var logger = require('tracer').console();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mustacheExpress = require('mustache-express');
var MinoDB = require('minodb');
var FieldVal = require('fieldval');
var BasicVal = FieldVal.BasicVal;
var FVRule = require('fieldval-rules');

var server = express();

server.engine('mustache', mustacheExpress());
server.set('view engine', 'mustache');
server.set('views', __dirname + "/views");
server.use(express.static("./public"));
server.use(bodyParser());
server.use(cookieParser());

var mino = new MinoDB({
	db_address: "mongodb://localhost:27017/mino-auth"
}, "my_app");


server.use('/mino/', mino.server());

var MinoAuth = MinoDB.Auth;

var auth = new MinoAuth({
	name: "my_app_auth",
	display_name: "My app auth",
	user_path: "/my_app/users/",
	session_path: "/my_app/sessions/",
	cookie_name: "my_app_token",
	username: "my_app"
})

var my_user_rule = require('./public/my_user_rule');

auth.create_user = function(object, callback) {
	var auth = this;
	var rule = new FVRule();
	rule.init(my_user_rule);
	rule.validate(object, function(err) {
		if (err) {
			callback(err);
		} else {
			mino.save([
		        {  
		            "name": object.my_username,
		            "path": auth.user_path,
		            "my_user": object
		        }
			], function(save_err, save_res){
			    logger.log(save_err, save_res);
			    callback(save_err, save_res);
			})		
		}
	})
}

auth.login = function(object, options, callback) {
	var auth = this;
    auth.get_user("my_user.my_username", object.my_username, function(error,user_record){
    	if (error) {
    		callback(error);
    	} else if (!user_record) {
    		callback(null, null);
    	} else if (user_record) {
    		logger.log(user_record, object);
    		if (user_record.my_user.my_password == object.my_password) {

    			auth.create_session(user_record._id, function(session_err,session_res){
    				logger.log(
    					JSON.stringify(session_err,null,4),
    					session_res
    				);
    				callback(null, user_record, session_res);

    			})

    		} else {
    			callback({error: 117, error_message: "Incorrect password"});
    			return;
    		}

    	}
    });

}


mino.add_plugin(auth);

require('./initial_data')(mino, function() {
	logger.log("FINISHED INITIAL_DATA");
});

server.post('/login', function(req, res) {
	logger.log(req.body);
	auth.login(req.body, {identifier: "my_username"}, function(err, user, session) {
		if (err) {
			var validator = new FieldVal(null);
			if (err.error == 117) {
				validator.invalid("my_password", err)
			} else {
				validator.invalid("my_username", err)
			}
			return res.json(validator.end());
		} else if (user){
			auth.persist_session(res, session);
			res.json({success:true});	
		} else {
			res.json({success: false});
		}
	})

});

server.post('/sign_out', function(req, res) {
	auth.sign_out(res);
	res.json({success:true});
})

server.get('/', auth.process_session({required:false}), function(req,res) {
	logger.log(req.user);
	var options = {
		user: JSON.stringify(req.user) || "undefined"
	}
	res.render('index', options);
});

server.listen(5000);