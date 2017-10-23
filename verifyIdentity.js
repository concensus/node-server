// Twilio Credentials
var accountSid = process.env.accountSid;
var authToken = process.env.authToken;
if (!accountSid) { return console.error("no accountSid in env") }
if (!authToken) { return console.error("no authToken in env") }
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken);

module.exports = {
    send: function (req, res) {
        client.messages.create({
            to: req.params.info.split("@")[0] || "4084313552",
            from: "+15106835584",
            body: `[concensus] Your verification Code is ${randomCode()}`,
        }, function (err, message) {
            if (!err) {
                return res.send({
                    good: true
                });
            }
            return res.status(500).send(err)
        });
    }
}

function randomCode(){
    var code = '';
    for (var i=0;i<4;i++){
        code += Math.floor(Math.random()*9)
    }
    return code;
}