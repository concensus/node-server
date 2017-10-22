
require("dotenv").config();

const app = require('express')();

const Web3 = require('web3');

const web3Provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(web3Provider);


const PollContractABI = require('../solidityFiles/Poll.json');
const TruffleContract = require('truffle-contract');
const DEFAULT_GAS = 4000000;

let PollContract = TruffleContract(PollContractABI);
PollContract.setProvider(web3Provider);

function createPoll (title, proposition, endTime, votesRequired, votesAllowed, msgSender) {
    let myInstance;
    
    return PollContract.new(
        title, 
        proposition, 
        endTime, 
        votesRequired, 
        votesAllowed, 
        { from: msgSender, gas: DEFAULT_GAS })
    .then((instance) => {
        console.log("Instance Address: " + instance.address)
        _logPollInfo(instance.address);
        return instance.address;
    })
    .catch(function (error) {
        console.trace("THIS THE ERROR: " + error);
        console.log("Promise Rejected2");
    });
};

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
        console.log(endTime.toNumber())
        return PollContract.at(contractAddress)._votesRequired.call()
    })
    .then((votesRequired) => {
        console.log(votesRequired.toNumber())
        return PollContract.at(contractAddress)._votesAllowed.call()
    })
    .then((votesAllowed) => {
        console.log(votesAllowed.toNumber())
    })
}

let pollAddress;

app.post('/createPoll', (req, res) => {
    createPoll('Boba', 'Should we get boba?', 1508691600, 6, 1, '0xa6da6bc67b3e9d9b2d70f277e43cd9f668c93234')
    .then((address) => {
        pollAddress = address;
        res.send(address);
    }).catch(function (err) {
        console.error("The promise was rejected.");
        console.trace(err);
    });
});
    
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

const voters = [];

const votes = {
    "yes": 0,
    "no": 0,
    "voters": voters
};

app.get('/newAccount', (req, res) => {
    const responseObject = web3.eth.accounts.create()
    res.send(responseObject)
});

eventEmitter.on('vote', (voter, vote) => {
    switch(vote) {
        case 0: {
            votes.yes += 1;
            break;
        }

        case 1: {
            votes.no += 1;
        }
    }

    voters.push(voter);
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 3001});

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log('Received: %s', message);
    });
    
    ws.send('Connection opened');
});

var pollInstance;

app.get('/votes', (req, res) => {
    PollContract.at(pollAddress).then(instance => {
        pollInstance = instance;
        res.send(`Successfully deployed poll.`);
    });
});

app.post('/send/:number', require('./verifyIdentity').send);

if (pollInstance) {
    let transactions = pollInstance.Voted({fromBlock: "latest"});
    transactions.watch((error, result) => {
        if (error) {
            console.error(error);
        } else {
            eventEmitter.emit('vote', result.voterAddress, result.voteType);
        }
    });
};

app.post('/vote', (err, req, res) => {
    PollContract.at(pollAddress).then(instance => {
        instance.vote(req.body.voteType, { from: req.body.account, gas: DEFAULT_GAS });
        res.status(200).send('Successfully voted.');
    }).catch(error => {
        console.error(error);
        res.status(404).send('Could not vote.');
    });
});

app.delete('/votes', (req, res) => {
        wss.broadcast = () => {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(votes);
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
});

process.on('exit', () =>{
    wss.close();
});

const server = app.listen(3000, () => {
    console.log(`App is listening on port ${server.address().port}...`);
});
    