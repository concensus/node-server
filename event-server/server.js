

const app = require('express')();

const Web3 = require('web3');

const web3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(web3Provider);


const PollContractABI = require('../solidityFiles/Poll.json');
const TruffleContract = require('truffle-contract');
const DEFAULT_GAS = 4000000

let PollContract = TruffleContract(PollContractABI)
PollContract.setProvider(web3Provider)

console.log(PollContract)

// web3.eth.net.getNetworkType()
// .then(console.log);
//
// web3.eth.net.isListening()
// .then(console.log)

app.post('/createPoll', (req, res) => {
  //createPoll("test", "test2", 10, 2, 1, {from: "0xcd15fea156c1c9d10e5b912b86a453d910c25df9"})
  _logPollInfo("0x34e5a6371897510bc2233114157579d8c1a6eb57")
  .then((address) => {
    res.send(address);
  }).catch(function () {
     console.log("Promise Rejected1");
});
})

function createPoll (title, proposition, endTime, votesRequired, votesAllowed, msgSender)  {
    console.log(`Create poll: ${title}, ${proposition}, ${endTime}, ${votesRequired}, ${votesAllowed}`)
    let myInstance;
    return PollContract.new(title, proposition, endTime, votesRequired, votesAllowed,
      {from: msgSender, gas: DEFAULT_GAS})
    .then((instance) => {
        console.log("Instance Address: " + instance.address)
        logPollInfo(instance.address);
        return instance.address;
    })
    .catch(function (error) {
      console.trace("THIS THE ERROR: " + error);
     console.log("Promise Rejected2");
   });
}

 function _logPollInfo (contractAddress) {
  return PollContract.at(contractAddress)._title.call()
  .then((title) => {
    console.log(title)
    return PollContract.at(contractAddress)._proposition.call()
  })
  .then((proposition) => {
    console.log(proposition);
    return PollContract.at(contractAddress)._endTime.call()
  })
  .then((endTime) => {
    console.log(endTime)
    return PollContract.at(contractAddress)._votesRequired.call()
  })
  .then((votesRequired) => {
    console.log(votesRequired)
    return PollContract.at(contractAddress)._votesAllowed.call()
  })
  .then((votesAllowed) => {
    console.log(votesAllowed)
  })
}



const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

const options = {};

app.get('/newAccount', (req, res) => {
  const responseObject = web3.eth.accounts.create()
  res.send(responseObject)
});


eventEmitter.on('vote', (option, vote) => {
    if (options[option]) {
        options[option] += 1;
    } else {
        options[option] = 1;
    }
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 3001});

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log('Received: %s', message);
    });

    ws.send('Connection opened');
});

let subscription = '';



app.get('/votes', (req, res) => {
    subscription = web3.eth.subscribe('logs', {
        address: req.query.address,
        topics: ['vote']
    }, (error, result) => {
        if (error) {
            console.error(`Error subscribing to address, ${req.query.address}, ${error}`);
            res.status(404).end();
        } else {
            res.send(`Successfully subscribed to logs from ${subscription.id}`);
        }
    });
});

// subscription.on('data', (result) => {
//     eventEmitter.emit('vote', result.option, result.vote);
// });

app.post('/votes', (req, res) => {
    subscription.unsubscribe((error, success) => {
        if (error) {
            console.error(`Error unsubscribing from ${subscription.id}`);
            res.status(404).end();
        } else {
            wss.broadcast = () => {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(options);
                    }
                });
            };

            wss.broadcast = () => {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.close();
                    }
                });
            };

            res.send(`Successfully unsubscribed from ${subscription.id}`);
        }
    });
});

process.on('exit', () =>{
    wss.close();
});

const server = app.listen(3000, () => {
    console.log(`App is listening on port ${server.address().port}...`);
});
