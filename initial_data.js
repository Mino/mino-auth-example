var logger = require('tracer').console();
var my_user_rule = require('./public/my_user_rule');

module.exports = function(mino, callback) {
	mino.create_user({
		username: "my_app",
		password: "testtest",
		email: "stan@minocloud.com"
	}, function(err, res) {
		logger.log(err, res);
		mino.save_type(my_user_rule, function(err, res) {
			mino.save([
				{
					name: "users",
					path: "/my_app/",
					folder:true
				},
				{
					name: "sessions",
					path: "/my_app/",
					folder:true
				},
			], function(err, res) {
				var auth = mino.get_plugin('my_app_auth');
				auth.create_user({
					my_username: "new_stan",
					my_password: "testtest"
				}, function(err, res) {
					logger.log(err, res);
					callback();
				})		
			})
		})
	})
}