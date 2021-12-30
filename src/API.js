"use strict";

const RPC = require('./JSONRPC');
const RPCConnection = require('./RPCConnection');
const Wallet = require('./Wallet');
const axios = require('axios');
const _ = require('lodash');
const StorageBlock = require('./StorageBlock');
const DownloadedFile = require("./DownloadedFile");

const EVENT_MESSAGE = 'message';
const EVENT_CONNECTED = 'connected';
const EVENT_DISCONNECTED = 'disconnected';

module.exports = class {
    /**
     * Create API instance
     * @param mnemonicOrWallet {string|Wallet} wallet to use for sign and encryption
     * @param initUrl {string} url to get seeds from
     * @param seeds {string[]} seeds to use if initUrl is missing
     * @param nativescript {boolean} is API running under nativescript env
     * @param appWallet {Wallet} wallet to use for App authentication
     */
    constructor(mnemonicOrWallet, {initUrl = '', seeds = [], nativescript = false, appWallet = null} = {}) {
        if (mnemonicOrWallet) {
            if (typeof mnemonicOrWallet === 'string') {
                this.wallet = new Wallet(mnemonicOrWallet);
            } else if (typeof mnemonicOrWallet === 'object') {
                this.wallet = mnemonicOrWallet;
            } else {
                throw Error('Unknown type of mnemonicOrWallet: ' + typeof mnemonicOrWallet);
            }
        } else {
            this.wallet = null;
        }

        this.connection = new RPCConnection(this.wallet, [], []);

        if (seeds.length) {
            this.connection.setSeeds(seeds);
        }

        this.initUrl = initUrl;
        this.allocatedPeers = [];
        this.recipientPeers = {};

        if (nativescript) {
            this.SocketIO = require('@triniwiz/nativescript-socketio').SocketIO;
            this.EncodedFile = require('./EncodedFileNativescript');
        } else {
            this.SocketIO = require('socket.io-client');
            this.EncodedFile = require('./EncodedFile');
        }

        this.socket = null;
        this.messageEventListeners = [];
        this.connectEventListeners = [];
        this.disconnectEventListeners = [];

        this.appWallet = appWallet;
        this.connection.setAppWallet(appWallet);
    }

    /**
     * Change wallet used by API  calls
     * @param mnemonicOrWallet {string|Wallet} mnemonic or Wallet to use
     */
    setWallet(mnemonicOrWallet) {
        if (typeof mnemonicOrWallet === 'string') {
            this.wallet = new Wallet(mnemonicOrWallet);
        } else if (typeof mnemonicOrWallet === 'object') {
            this.wallet = mnemonicOrWallet;
        } else {
            throw Error('Unknown type of mnemonicOrWallet: ' + typeof mnemonicOrWallet);
        }

        this.connection.setWallet(this.wallet);
    }

    /**
     * Get owner's address in bech32
     * @returns {string}
     * @private
     */
    _getAddress() {
        return this.wallet.address;
    }

    _getPeerUrl(peer) {
        if (peer.port) {
            return 'http://' + peer.ip + ':' + peer.port;
        }

        return 'http://' + peer.ip + ':26661';
    }

    _peersForMessage() {
        return this.allocatedPeers.map(peer => ({
            owner: peer.owner,
            url: this._getPeerUrl(peer),
        }));
    }

    /**
     * connect to peer using SocketIO to get storage events
     * @param lastPeer {string} last peer we connect successfully
     */
    connectEventSource(lastPeer = null) {
        if (!lastPeer) {
            lastPeer = this.connection.lastPeer;
        }

        this.socket = new this.SocketIO(lastPeer, {reconnect: true});
        this.socket.connect();

        this.socket.on('connect', () => {
            console.log('connected, subscribing');
            this.socket.emit('subscribe', this._getAddress());
            this.connectEventListeners.forEach((listener) => {
                listener();
            });
        });

        this.socket.on('disconnect', (reason) => {
            this.disconnectEventListeners.forEach((listener) => {
                listener(reason);
            });
        });

        this.socket.on("error", error => {
            console.error(error);
        });

        this.socket.on('message', (event) => {
            console.log('Remote event', event);
            this.messageEventListeners.forEach((listener) => {
                listener(event);
            });
        });
    }

    /**
     * Add listener for live events
     * @param event {string} Event to listen for
     * @param callback {function(event)} listener callback
     */
    addEventsListener(event, callback) {
        if (event === EVENT_MESSAGE) {
            this.messageEventListeners.push(callback);
        }
        if (event === EVENT_CONNECTED) {
            this.connectEventListeners.push(callback);
        }
        if (event === EVENT_DISCONNECTED) {
            this.disconnectEventListeners.push(callback);
        }
    }

    /**
     * remove live event listener
     * @param event
     * @param callback
     */
    removeEventsListener(event, callback) {
        if (event === EVENT_MESSAGE) {
            this.messageEventListeners = this.messageEventListeners.filter(listener => listener !== callback);
        }
        if (event === EVENT_CONNECTED) {
            this.connectEventListeners = this.connectEventListeners.filter(listener => listener !== callback);
        }
        if (event === EVENT_DISCONNECTED) {
            this.disconnectEventListeners = this.disconnectEventListeners.filter(listener => listener !== callback);
        }
    }

    /**
     * Init API
     * @param loadSeeds
     * @param loadPeers
     * @returns {Promise<void>}
     */
    async start(loadSeeds = true, loadPeers = true) {
        // Find seeds (request from remote or use provided)
        if (!this.connection.haveSeeds()) {
            if (this.initUrl) {
                const config = await axios.get(this.initUrl);

                this.connection.setSeeds(config.data.seeds);
            } else {
                throw Error('No seeds and initUrl provided');
            }
        }

        // Load control nodes
        if (loadSeeds) {
            await this.loadSeeds();
        }

        // Load worker nodes
        if (loadPeers) {
            await this.loadPeers();
        }
    }

    /**
     * Load control nodes list from server or other control node
     * @returns {Promise<void>}
     */
    async loadSeeds() {
        let seeds = await this.connection.callSeed(
            RPC.METHOD_GET_LOCATION,
            {address: this._getAddress()}
        );

        if (seeds.result.peers && seeds.result.peers.length) {
            this.connection.setSeeds(seeds.result.peers);
        } else {
            throw Error('No seeds found for address ' + this._getAddress());
        }
    }

    /**
     * Load work nodes list from control node
     * @param address
     * @returns {Promise<{owner: *, url: *}[]>}
     */
    async loadPeers(address = null) {
        if (!address) {
            address = this._getAddress();
        }
        let response = await this.connection.callSeed(RPC.METHOD_GET_CHAT_PEERS, {address: address});

        // Chat holders not allocated yet
        if (response.result.holders && !response.result.holders.length) {
            // use
            return (address === this._getAddress()) ? this.allocatePeers() : null;
        }

        if (response.result.holders && response.result.holders.length) {
            // use
            if (address === this._getAddress()) {

                this.allocatedPeers = response.result.holders;

                let peers = response.result.holders.map(this._getPeerUrl);

                this.connection.setPeers(peers);

                if (peers.length < 5) {
                    return this.allocatePeers();
                }
            } else {
                return response.result.holders.map(peer => {
                    return {
                        owner: peer.owner,
                        url: this._getPeerUrl(peer),
                    };
                });
            }
        }
    }

    /**
     * Allocate new worker nodes for current API owner
     * @returns {Promise<void>}
     */
    async allocatePeers() {
        let response = await this.connection.callSeed(RPC.METHOD_ALLOCATE_CHAT_PEERS, {address: this._getAddress()}, {sign: true});

        if (response.result && (!response.result.nodes || !response.result.nodes.length)) {
            throw Error('Unable to allocate new chat nodes');
        }

        if (response.result && response.result.nodes) {
            console.log('Chat peers', response.result.nodes);

            this.allocatedPeers = response.result.nodes;
            let peers = response.result.nodes.map(this._getPeerUrl);

            this.connection.setPeers(peers);
            return this.persistPeers();
        }
    }

    /**
     * Persist current worker nodes list to control nodes
     * @returns {Promise<void>}
     */
    async persistPeers() {
        return this.connection.callSeed(
            RPC.METHOD_PERSIST_CHAT_PEERS,
            {address: this._getAddress(), holders: this.allocatedPeers.map(peer => peer.owner)},
        );
    }

    /**
     * Find account data in blockchain (using control node blockchain proxy)
     * @param address {string} beck32 address to find
     * @returns {Promise<{result}|*>}
     */
    async bcGetAddressData(address) {
        return this.connection.callSeed(RPC.METHOD_BC_GET_ADDRESS_DATA, {address});
    }

    /**
     * Load contacts data from control node
     * @returns {Promise<{result}|*>}
     */
    async getContactsAsBuffer() {
        return await this.connection.callSeed(RPC.METHOD_CHAT_GET_CONTACTS, {address: this._getAddress()});
    }

    _decryptBlock(block, pk = true) {
        if (block.headerEncryption === StorageBlock.BLOCK_ENCRYPTION_INTERNAL) {
            block.decryptInternal(pk ? this.wallet.privateKey.toString() : this.wallet.publicKey.toString(), true);
            return;
        }

        if (block.headerEncryption === StorageBlock.BLOCK_ENCRYPTION_SECP256) {
            block.decryptSecp256(this.wallet.privateKey);
            return;
        }

        if (block.headerEncryption === StorageBlock.BLOCK_ENCRYPTION_SECP256_XCHACHA20) {
            block.decryptSecp256XChaCha20(this.wallet.privateKey);
            return;
        }

        throw Error('Unsupported encryption type');
    }

    /**
     * Get contacts list from control nodes as JSON object
     * @returns {Promise<any>}
     */
    async getContactsAsJson() {
        let data = await this.getContactsAsBuffer();
        if (!data.result.data) {
            throw Error('Invalid response');
        }
        let block = StorageBlock.fromBase64(data.result.data);
        this._decryptBlock(block);
        if (!block.isSignValid()) {
            throw Error('Checksum is invalid');
        }
        return JSON.parse(block.getData().toString('utf8'));
    }

    /**
     * Store contacts list to control nodes
     * @param contacts
     * @returns {Promise<{result}|*>}
     */
    async putContactsFromJson(contacts) {
        let bytes = Buffer.from(JSON.stringify(contacts), 'utf8');
        let block = StorageBlock.fromData(bytes);
        block.encryptSecp256XChaCha20(this.wallet.publicKey);
        return this.connection.callSeed(RPC.METHOD_CHAT_SET_CONTACTS, {
            address: this._getAddress(),
            data: block.toBase64()
        });
    }

    /**
     * Find user by name | address using control node
     * @param name {string} Data to search
     * @param ignoreVisibility {boolean} Ignore user's visibility flags (to support incoming chats)
     * @returns {Promise<{result}|*>}
     */
    async findContact(name, ignoreVisibility = false) {
        return this.connection.callSeed(RPC.METHOD_BC_FIND_ACCOUNT, {query: name, ignoreVisibility});
    }

    /**
     * Request metadata (settings and etc.) from control nodes
     * @param address {string} bech32 address
     * @returns {Promise<{result}|*>}
     */
    async getMetadata(address = null) {
        return this.connection.callSeed(RPC.METHOD_CHAT_GET_METADATA, {address: address ? address : this._getAddress()});
    }

    /**
     * Update metadta (settings and etc.) on control nodes
     * @param metadata
     * @returns {Promise<{result}|*>}
     */
    async setMetadata(metadata) {
        return this.connection.callSeed(
            RPC.METHOD_CHAT_SET_METADATA,
            {
                address: this._getAddress(),
                metadata
            },
            {sign: true});
    }

    /**
     * Get metadata from work nodes (used space and some other)
     * @param address {string} bech32 address
     * @returns {Promise<{result}|*>}
     */
    async getPeerMetadata(address = null) {
        return this.connection.callPeer(
            RPC.METHOD_CHAT_GET_METADATA,
            {
                address: address ? address : this._getAddress(),
            },
            {sign: true});
    }


    /**
     * Send JSON object to recipient
     * @param address {string} bech32 encoded recipient's address
     * @param pubkey {PublicKey} recipient's public key
     * @param object {Object} JSON to send
     * @param relatedHashes {Buffer[]} blocks related with message (for attachments)
     * @param isStorage {Boolean} is recipient is the same as sender (Chat-storage support)
     * @returns {Promise<{payload: {owner: *, isStorage: boolean, data: *, relatedHashes: *, recipient: *, recipientData: string|*, senderHolders: *, recipientHash: string|*, recipientHolders: *, hash: *}, response: ({result}|*)}>}
     */
    async sendJsonToRecipient(address, pubkey, object, relatedHashes, isStorage = false) {
        // 1. insure peers, fill-in cache if needed
        let peers = this.recipientPeers[address];
        if (!isStorage && !peers) {
            this.recipientPeers[address] = await this.loadPeers(address);
            peers = this.recipientPeers[address];
        }

        // 2. prepare 2 blocks encrypted with different keys for sender and recipient
        let bytes = Buffer.from(JSON.stringify(object), 'utf8');
        let senderBlock = StorageBlock.fromData(bytes);
        let recipientBlock = null;
        senderBlock.encryptSecp256XChaCha20(this.wallet.publicKey);
        if (!isStorage) {
            recipientBlock = StorageBlock.fromData(bytes);
            recipientBlock.encryptSecp256XChaCha20(pubkey);
        }

        let request = {
            owner: this._getAddress(),
            recipient: address,
            hash: senderBlock.getSign().toString('hex'),
            recipientHash: isStorage ? '' : recipientBlock.getSign().toString('hex'),
            data: senderBlock.toBase64(),
            recipientData: isStorage ? '' : recipientBlock.toBase64(),
            senderHolders: this._peersForMessage(),
            recipientHolders: peers,
            relatedHashes,
            isStorage
        };

        // 3. send data to our peer
        return {
            payload: request,
            response: await this.connection.callPeer(RPC.METHOD_CHAT_PUT_MESSAGE, request, {sign: true})
        };
    }

    /**
     * Load messages from work nodes
     * @param timestamp {int} Unix timestamp of first message to load
     * @param limit {int} number of messages to load (100 is hard limit)
     * @param source {string} message source to find - chat / storage / all
     * @returns {Promise<{result}|*>}
     */
    async getMessages(timestamp = 0, limit = 50, source = 'chat') {
        let result = await this.connection.callPeer(RPC.METHOD_CHAT_GET_MESSAGES, {
            owner: this._getAddress(),
            from: timestamp,
            limit,
            source
        }, {sign: true});

        if (!result.result || result.result.error) {
            throw Error('Unable to load messages');
        }

        let maxTimestamp = 0;
        result.result.messages = result.result.messages.map(message => {
            if (message.timestamp > maxTimestamp) {
                maxTimestamp = message.timestamp;
            }

            try {
                let block = StorageBlock.fromBase64(message.message);
                this._decryptBlock(block, false);

                return {
                    timestamp: message.timestamp,
                    hash: block.getSign().toString('hex'),
                    message: JSON.parse(block.getData().toString('utf8'))
                };
            } catch (e) {
                console.log('!!!!Decode error', e);
                return {
                    timestamp: message.timestamp,
                    message: 'decode_error',
                };
            }
        });

        result.result.lastTimestamp = maxTimestamp;
        return result;
    }

    /**
     * Request control node to get worker nodes to store block data
     * @param count {int} blocks count
     * @param size {int} blocks size
     * @param owner {string} beck32 encoded owners address
     * @returns {Promise<{result}|*>}
     */
    async allocateBlocks(count, size, owner = null) {
        if (!owner) {
            owner = this._getAddress();
        }
        return this.connection.callSeed(RPC.METHOD_ALLOCATE_NODES,
            {
                owner: owner,
                count: count,
                size: size,
            });
    }

    /**
     * Remove user messages from worker nodes
     * @param messages {string[]} messages to remove
     * @param isStorage {boolean} remove messages from storage-chat
     * @returns {Promise<{result}|*>}
     */
    async removeMessages(messages, isStorage) {
        return this.connection.callPeer(RPC.METHOD_CHAT_REMOVE_MESSAGES,
            {
                owner: this._getAddress(),
                isStorage,
                toRemove: messages
            },
            {sign: true});
    }

    /**
     * Upload big (more then 1mb) file to storage
     * @param sourcePath {string} File path
     * @param recipient {string|boolean} beck32 encoded recipient's address
     * @param recipientPubKey {PublicKey|null} recipient's Public Key
     * @param blockCallback {function(number, number)} callback for each block upload
     * @param copyPath {string} path to copy file to (optional)
     * @returns {Promise<{recipientBlocks: [], hash, senderBlocks: []}>}
     */
    async uploadFile(sourcePath, recipient, recipientPubKey, blockCallback, copyPath) {
        try {
            const f = new this.EncodedFile(sourcePath);
            const size = f.getSize();
            const blocksCount = f.countBlocks();
            // Upload file parts for recipient
            let recipientHolders = null;
            if (recipient) {
                recipientHolders = await this.allocateBlocks(blocksCount, size, recipient);
            }
            let recipientBlocks = [];
            // Upload file parts for sender
            let senderHolders = await this.allocateBlocks(blocksCount, size, this._getAddress());
            let senderBlocks = [];
            let blockIndex = 0;

            await f.processFileAsync(async (data) => {
                const senderBlock = StorageBlock.fromData(data);
                senderBlock.encryptSecp256XChaCha20(this.wallet.publicKey);
                const senderEncryptedBlock = senderBlock.toBuffer();
                const senderHash = senderBlock.getSign().toString('hex');
                senderBlocks.push(senderHash);

                let recipientBlock = null;
                let recipientEncryptedBlock = null;
                let recipientHash = null;

                if (recipientHolders) {
                    recipientBlock = StorageBlock.fromData(data);
                    recipientBlock.encryptSecp256XChaCha20(recipientPubKey);
                    recipientEncryptedBlock = recipientBlock.toBuffer();
                    recipientHash = recipientBlock.getSign().toString('hex');
                    recipientBlocks.push(recipientHash);
                }

                let request = {
                    sender: this._getAddress(),
                    recipient: recipient,
                    recipientHolders: recipientHolders ? recipientHolders.result.nodes[blockIndex] : [],
                    senderHolders: senderHolders.result.nodes[blockIndex],
                    senderHash: senderHash,
                    recipientHash: recipientHash,
                    signature: this.wallet.signJsonSync().toString('hex')
                };

                // sign base message
                request.senderSign = this.wallet.signJsonSync(request).toString('hex');

                request.senderData = senderEncryptedBlock.toString('base64');
                request.recipientData = recipientHolders ? recipientEncryptedBlock.toString('base64') : '';

                // send request (with overall sign)
                await this.connection.callPeer(RPC.METHOD_PUT_BLOCK_FOR_CHAT, request, {sign: true});

                if (blockCallback) {
                    try {
                        blockCallback(blockIndex, senderHolders.result.nodes.length);
                    } catch (e) {
                        console.error(e);
                    }
                }

                blockIndex++;
            }, copyPath);

            // 5. Send message to Store
            // build message fields using callback
            return {
                hash: f.getHashHex(),
                senderBlocks,
                recipientBlocks
            };
        } catch (e) {
            console.error('upload error', e);
            throw e;
        }
    }

    /**
     * Find nodes holding specified block
     * @param blocks {string} block hash
     * @returns {Promise<{result}|*>}
     */
    async getBlockHolders(blocks) {
        return this.connection.callSeed(RPC.METHOD_GET_BLOCKS_HOLDERS, {
            owner: this._getAddress(),
            blocks: blocks
        });
    }

    /**
     * Download file from storage
     * @param blocks {string[]} file parts' hashes
     * @param filename {string} resulting file name
     * @param stepCallback {function} callback for each block download
     * @returns {Promise<void>}
     */
    async downloadFile(blocks, filename, stepCallback = null) {
        // 1. Get block holders
        let holders = await this.getBlockHolders(blocks.map(block => ({hash: block})));
        // 2. Get each block, writing it to file
        let index = 0;
        let file = new DownloadedFile(filename);
        for (let block of holders.result.holders) {
            if (stepCallback) {
                stepCallback(filename, block, index, holders.result.holders.length);
            }

            index++;

            let blockHolders = _.shuffle(block.holders);

            let data = null;

            for (let holder of blockHolders) {
                try {
                    let response = await RPC.callApi(RPC.METHOD_GET_BLOCK, {
                        owner: this._getAddress(),
                        hash: block.block,
                    }, holder.url, false, this.appWallet);

                    if (response.result && response.result.data && response.result.data.data) {
                        let sb = StorageBlock.fromBase64(response.result.data.data);
                        this._decryptBlock(sb, false);
                        data = sb.getData();
                        break;
                    }
                } catch (e) {
                }
            }

            if (!data) {
                throw Error('Unable to download required block');
            }

            file.addBlock(data.toString('base64'));
        }
        // 3. Profit
        file.save();
    }

    async dispose() {
        this.disconnectEventListeners = [];
        this.connectEventListeners = [];
        this.messageEventListeners = [];
        this.wallet = null;
        try {
            if (this.socket) {
                this.socket.disconnect();
            }
        } catch (e) {
            console.error('Dispose api error');
        }
    }

    getLastPeer() {
        return this.connection.lastPeer;
    }
};

module.exports.EVENT_MESSAGE = EVENT_MESSAGE;
module.exports.EVENT_CONNECTED = EVENT_CONNECTED;
module.exports.EVENT_DISCONNECTED = EVENT_DISCONNECTED;


