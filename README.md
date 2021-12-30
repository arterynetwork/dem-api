# What is this
This library provides JavaScript API to access DeM data (messages, attachments) in Artery Storage.
It's the same as used in Android and iOS application and fully supports NativeScript 7 & 8.

## Usage and installation
To install this library use npm:

```
npm add 'git+https://github.com/arterynetwork/dem-api.git#semver:^1.0.0'
```

Example below illustrates how to create wallet (used to sign requests and encrypt data),
initialize API and connect it to storage Control Nodes. Then use API to download and log 
all user messages from storage 

```
const { API, Wallet } = require('dem-api')

const seed1 = '<wallet mnemonic>';
const signKey = '<application key in hex>';

// Key needed to sign requests to nodes
const appWallet = new Wallet(null, signKey);

const api = new API(seed1, {appWallet, seeds: [<control nodes addresses>]})

// Initialize api (connects to control nodes, find peers and etc.)
api.start().then(async () => {
    console.time();
    console.log('API Started', api._getAddress())
    console.log(await api.getPeerMetadata());

    console.time('read_messages');
    let hasMore = true;
    let timestamp = 0;
    while (hasMore) {
        console.time('request')
        // read messages from remote nodes (no more then 100 at once)
        let messages = (await api.getMessages(timestamp, 100)).result;
        console.timeEnd('request')
        
        // more messages available
        hasMore = messages.hasMore;
        timestamp = (messages.messages[messages.messages.length - 1] || {}).timestamp || 0;
        for (let message of messages.messages) {
            console.log(message)
        }
    }

    console.timeEnd('read_messages')
    console.timeEnd();
}).catch(error => console.error(error));
```

API documentation are supplied as a JSDoc comments.

## Request signing
To protect storage from abuse, all request require to be signed with an app key
approved by the Leadership Council. For developing and testing purposes we plane to 
run a testnet (Q1, 2022), where key can be obtained in a simple way.

## Notes
Please note, due to active DeM development, this API is in progress and can be changed in the future

## Contributing
Please read [contributing](CONTRIBUTING.md) guide