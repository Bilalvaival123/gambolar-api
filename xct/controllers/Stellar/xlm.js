var StellarSdk = require('stellar-sdk');
var request = require('request');
var express = require('express');
var router = express.Router();
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// Create key pair
router.get('/create_wallet', function (req, response) {
    // var server = new StellarSdk.Server('https://horizon-mainnet.stellar.org');
	var ResponseCode = 200;
    var ResponseMessage = ``;
    var ResponseData = null;
	try
	{
		var pair = StellarSdk.Keypair.random();
		var secret_key = pair.secret();
		var public_key = pair.publicKey();
		var date = new Date();
		var timestamp = date.getTime();

		var keyPair = {
			'secret': secret_key,
			'public': public_key
		};
		// console.log(keyPair);
		// request.get({
			// url: 'https://horizon-testnet.stellar.org/friendbot/',
			// qs: {
				// addr: public_key
			// },
			// json: true
		// }, function (error, response1, body) {
			// if (error || response1.statusCode !== 200) {
				// console.error('ERROR!', error || body);
			// } else {
				// console.log('SUCCESS! You have a new account :)\n', body);
			// }
		// });
		
		ResponseData = {
			wallet: {
				private: keyPair.secret,
				public: keyPair.public,
				currency: "XLM",
				balance: 0,
				create_date: date,
			},
			message: "",
			timestamp: timestamp,
			status: 200,
			success: true
		};
		ResponseMessage = "Completed";
		ResponseCode = 200;
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});

// Get Balance
router.get('/getBalance/:wallet_address', async function (request, response) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
	
		if(request.params) {
			if (!request.params.wallet_address) {
				ResponseMessage = "wallet address is missing \n";
				ResponseCode = 206;
			} else {
			
				// var server = new StellarSdk.Server('https://horizon.stellar.org'); //For Mainnet
				
				let walletAddress = request.params.wallet_address;
				
				ResponseData = await getBalance(walletAddress);
				ResponseMessage = "Completed";
				ResponseCode = 200;
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
    
});

function getBalance(walletAddress) {
	var data;
	return new Promise(function(resolve, reject) {
		
		server.loadAccount(walletAddress).then(function (account) {
			var Balance = 0;
			// var balanceList = [];
			var date = new Date();
			var timestamp = date.getTime();
			account.balances.forEach(function (balance) {
				 console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
				// var singleBalance = {};
				// singleBalance['currency'] = balance.asset_type;
				// singleBalance['Balance'] = balance.balance;
				Balance = balance.balance;
			});	
			data = {
				wallet: {
					address: walletAddress,
					balance : Balance
				},
				message: "",
				timestamp: timestamp,
				status: 200,
				success: true
			};
			resolve(data);	
		});
	});
}

//-----------------------------Get Transactions of Account or by hash----------------------------------------------
router.get('/track/:hash', async function (request, response) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(request.params) {
			if (!request.params.hash) {
				ResponseMessage = "hash / wallet address is missing \n";
				ResponseCode = 206;
			} else {
				let hash = request.params.hash;
				if (hash.length == 64) {
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", 'https://horizon-testnet.stellar.org/transactions/' + hash+"/payments", false ); // false for synchronous request
					xmlHttp.send();
					var transaction = JSON.parse(xmlHttp.responseText);
					var transactions = transaction._embedded.records[0];
					let tempaddress = "";	
					if(transactions.type_i == 0) {
						tempaddress = transactions.account;
					} else {
						tempaddress = transactions.to;
					}
					ResponseData = {
						transaction: {
							hash: transactions.txid,
							from: transactions.source_account,
							to: tempaddress,
							amount: transactions.amount,
							// fee: transactions.fees,
							// block: transactions.blockheight,
							// n_confirmation: transactions.confirmations,
							transaction_successful : transactions.transaction_successful,
							link: `https://horizon-testnet.stellar.org/transactions/${hash}/payments`
						},
						message: "",
						timestamp: transactions.created_at,
						status: 200,
						success: true
					};
					ResponseMessage = "Completed";
					ResponseCode = 200;
				} else if (hash.length == 56) {
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", "https://horizon-testnet.stellar.org/accounts/" + hash+"/payments", false ); // false for synchronous request
					xmlHttp.send();
					var transaction = JSON.parse(xmlHttp.responseText);
					var transactions = transaction._embedded;
					let _data = [];

					let tempaddress = "";	
					for (let i = 0; i < transactions.records.length; i++) {
					
						if(transactions.records[i].type_i == 0) {
							tempaddress = transactions.records[i].account;
						} else {
							tempaddress = transactions.records[i].to;
						}

							if (
							String(tempaddress)
							.toUpperCase()
							.localeCompare(String(hash).toUpperCase()) == 0
						) {
							_data.push(transactions.records[i]);
						}
						
					}
					ResponseData = {
						transaction: _data
					};
					ResponseMessage = "Completed";
					ResponseCode = 200;
				} else {
					ResponseMessage = "Invalid Hash or Wallet Address"
					ResponseCode = 400;
				}
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});

// // Send Transaction => Stellar
router.post('/transfer', async function(req,response,next){
	
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	
	try {
		if(req.body) {
			var ValidationCheck = true;
			if (!req.body.from_address) {
				ResponseMessage = "from address is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.to_address) {
				ResponseMessage += "to address is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.from_private_key) {
				ResponseMessage += "private key is missing \n";
				ValidationCheck = false;
			}
			if (!req.body.value) {
				ResponseMessage += "value is missing \n";
				ValidationCheck = false;
			} else if (!req.body.value === parseInt(req.body.value)) {
				ResponseMessage += "value must be a number \n";
				ValidationCheck = false;
			}
			
			if(ValidationCheck == true) {
				var sourceKeys = StellarSdk.Keypair.fromSecret(req.body.from_private_key);
				var destinationId = req.body.to_address;
				// Transaction will hold a built transaction we can resubmit if the result is unknown.
				var transaction;

				// First, check to make sure that the destination account exists.
				// You could skip this, but if the account does not exist, you will be charged
				// the transaction fee when the transaction fails.
				await server.loadAccount(destinationId)
				  // If the account is not found, surface a nicer error message for logging.
				  .catch(StellarSdk.NotFoundError, function (error) {
					ResponseMessage = 'The destination account does not exist!';
					ResponseCode = 400;
				  })
				  // If there was no error, load up-to-date information on your account.
				  .then(function() {
					return server.loadAccount(sourceKeys.publicKey());
				  })
				  .then(function(sourceAccount) {
					// Start building the transaction.
					transaction = new StellarSdk.TransactionBuilder(sourceAccount)
					  .addOperation(StellarSdk.Operation.payment({
						destination: destinationId,
						// Because Stellar allows transaction in many currencies, you must
						// specify the asset type. The special "native" asset represents Lumens.
						asset: StellarSdk.Asset.native(),
						amount: req.body.value
					  }))
					  // A memo allows you to add your own metadata to a transaction. It's
					  // optional and does not affect how Stellar treats the transaction.
					  .addMemo(StellarSdk.Memo.text('Test Transaction'))
					  .build();
					// Sign the transaction to prove you are actually the person sending it.
					transaction.sign(sourceKeys);
					// And finally, send it off to Stellar!
					return server.submitTransaction(transaction);
				  })
				  .then(function(result) {
					ResponseData = JSON.stringify(result);
					ResponseMessage = "Transaction successfully completed";
					ResponseCode = 200;
						//res.send(JSON.stringify(result));
				  })
				  .catch(function(error) {
					ResponseMessage = `Transaction signing stops with the error ${error}`;
					ResponseCode = 400
					// If the result is unknown (no response body, timeout etc.) we simply resubmit
					// already built transaction:
					// server.submitTransaction(transaction);
				  });
				
			} else {
				ResponseCode = 206
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request body is empty";
			ResponseCode = 204
		}
		
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}

    

    
  });

// router.post('/transfer', function (request, response) {

//     var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

//     var senderSecret = request.body.from_private_key;
//     var destinationId = request.body.to_address;
//     var currencyAmount = request.body.value;

//     var sourceKeys = StellarSdk.Keypair
//         .fromSecret(senderSecret);

//     var transaction;

//     server.loadAccount(destinationId)
//         // If the account is not found, surface a nicer error message for logging.
//         .catch(StellarSdk.NotFoundError, function (error) {
//             throw new Error('The destination account does not exist!');
//         })
//         // If there was no error, load up-to-date information on your account.
//         .then(function () {
//             console.log(sourceKeys.publicKey());
//             return server.loadAccount(sourceKeys.publicKey());
//         })
//         .then(function (sourceAccount) {
//             // Start building the transaction.
//             transaction = new StellarSdk.TransactionBuilder(sourceAccount)
//                 .addOperation(StellarSdk.Operation.payment({
//                     destination: destinationId,
//                     // Because Stellar allows transaction in many currencies, you must
//                     // specify the asset type. The special "native" asset represents Lumens.
//                     asset: StellarSdk.Asset.native(),
//                     amount: currencyAmount
//                 }))
//                 .addMemo(StellarSdk.Memo.text('Test Transaction'))
//                 .build();
//             // Sign the transaction to prove you are actually the person sending it.
//             transaction.sign(sourceKeys);
//             // And finally, send it off to Stellar!
//             return server.submitTransaction(transaction);
//         })
//         .then(function (result) {
//             console.log('Success! Results:', result);
//             response.contentType('application/json');
//             response.end(JSON.stringify(result));
//         })
//         .catch(function (error) {
//             console.error('Something went wrong!', error);
//         });

// });



// var bchAddress = express.Router();
// bchAddress.get('/', function(request, response){

//     const privateKey = new bch.PrivateKey();
//     const addr = privateKey.toAddress();

//     const Address = bch.Address;
//     const BitpayFormat = Address.BitpayFormat;
//     const CashAddrFormat = Address.CashAddrFormat;

//     const address = new Address(addr);

//     var public_key = address.toString(CashAddrFormat);
//     var secret_key = privateKey.toString();

//     console.log("Public Key: "+ public_key);
//     console.log("Secret Key: "+ secret_key);

//     var keyPair = {'secret': secret_key, 'public': public_key};

//     response.contentType('application/json');
//     response.end(JSON.stringify(keyPair));
// })
// app.use('/bch-address', bchAddress);


// var chekcValid = express.Router();
// chekcValid.get('/', function(request, response){


// var destinationId = "GAHGICZOZ267LIM64HZJTKJOOKOLEVU22FCFQUFO5KMCMPYAVNDG4LU6";
//   console.log("the adress is",destinationId);

//   server.loadAccount(destinationId)
//     // If the account is not found, surface a nicer error message for logging.
//     // If there was no error, load up-to-date information on your account.
//     .then(function() {
//       response.send("Fahad");
//     })
//     .catch(StellarSdk.NotFoundError, function (error) {
//       response.send("account does not exist");
//     })

// })
// app.use('/check-address', chekcValid);





// // Check Trust
// var checkAddr = express.Router();
// checkAddr.post('/', function (request, response){

//   var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

//   var accountId = request.body.addr;
//   console.log("the adress is",accountId);

//   server.loadAccount(accountId)
//   .catch(StellarSdk.NotFoundError, function (error) {
//    // response.contentType('application/json');
//     response.end(JSON.stringify("unvalid"));


//   })
//   .then(function() {
//    // response.contentType('application/json');
//     response.end(JSON.stringify("valid"));
//   })
// });
// app.use('/check-addr', checkAddr);

module.exports = router;
