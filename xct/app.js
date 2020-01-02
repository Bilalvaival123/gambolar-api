var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json({
    type: 'application/json'
}));
app.use(bodyParser.urlencoded({
    extended: true
}));

var eth = require('./controllers/Ethereum/eth');
var xct = require('./controllers/Cryptochats/xct');
var btc = require('./controllers/Bitcoin/btc');
var usdt = require('./controllers/Tether/usdt')
var xlm = require('./controllers/Stellar/xlm');
var testxct = require('./controllers/Cryptochats/testXct');
var testusdt = require('./controllers/Tether/testUsdt')
var testbnt = require('./controllers/Bancor/testBnt')
var testcrpt = require('./controllers/Crypterium/testCrpt')
var testlatoken = require('./controllers/Latoken/testLatoken')
var testbrd = require('./controllers/Bread/testBrd')
var dai = require('./controllers/Dai/dai')
var bat = require('./controllers/Bat/bat')
// var eos = require('./controllers/Eos/eos');
// var xrp = require('./controllers/Ripple/xrp');
 var bch = require('./controllers/BitcoinCash/bch')
 var testbch = require('./controllers/BitcoinCash/testbch')
// var ltc = require('./controllers/Litcoin/ltc')
// var trx = require('./controllers/Tron/trx')

var btcmain = require('./controllers/Bitcoin/btcmain');



app.use('/api/eth', eth);
app.use('/api/xct', xct);
app.use('/api/btc', btc);
app.use('/api/btcmain', btcmain);
app.use('/api/usdt', usdt);
app.use('/api/xlm', xlm);
app.use('/api/testxct', testxct);
app.use('/api/testusdt', testusdt);
app.use('/api/testbnt', testbnt)
app.use('/api/testcrpt', testcrpt)  
app.use('/api/testlatoken', testlatoken)
app.use('/api/testbrd', testbrd)
app.use('/api/dai', dai)
app.use('/api/bat', bat)
// app.use('/api/eos', eos);
// app.use('/api/xrp', xrp);
app.use('/api/testbch', testbch);
app.use('/api/bch', bch);
// app.use('/api/ltc', ltc);
// app.use('/api/usdt', usdt);
// app.use('/api/trx', trx);


app.get('/', function (request, response) {

    response.contentType('application/json');
    response.end(JSON.stringify("Node is running"));

});

app.get('*', function (req, res) {
    return res.status(404).json({
        msg: 'Page Not Found'
    });
});

app.post('*', function (req, res) {
    return res.status(404).json({
        msg: 'Page Not Found'
    });
});

if (module === require.main) {

    var server = app.listen(process.env.PORT || 80, function () {
        var port = server.address().port;
        console.log('App listening on port %s', port);
    });

}
