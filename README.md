## Binance TPS Test for Coin Transfer

##### Hardware: dedicated server at `nocix.net`

- Processor 2x E5-2660 @ 2.2GHz / 3GHz Turbo 16 Cores / 32 thread
- Ram 96 GB DDR3
- Disk 960 GB SSD
- Bandwidth 1Gbit Port: 200TB Transfer
- Operating System Ubuntu 18.04 (Bionic)

##### Network setup

- A network of 5 nodes was run.
- All nodes used the same IP, but different ports
- All nodes had mining turned on; each was a block producer

##### Test setup for native coin transfer

- 5000 accounts were loaded in the genesis block with 1000 ETH each
- 2500 native coin txs were submitted to the network as fast as possible
  - Each tx moved 1 ETH between two different randomly chosen accounts
  - The number of accounts was chosen to be equal to the number of total txs so that there would be a low chance of a tx getting rejected due to another transaction from the same account still pending.

##### Test result

- Tests are taken starting from 50 tps to 250 tps for 10 seconds. Time between the start of the test and the last block to process txs from the test was measured.
- Total txs ( with spamming rate ) = Average tps
  ```
    1000 ( 200 tps ) =  76 , 47 , 200 , 90
    1500 ( 100 tps ) = 107
    1500 ( 300 tps ) =  75 , 93 ,  71 , 83
    2000 ( 200 tps ) = 100
    2000 ( 400 tps ) = 111 , 86 ,  46
    2500 ( 250 tps ) = 156
  ```
- Estimated average tps is **100 TPS**

##### Comparison to bscscan.com

- The Binance Daily Transaction shows the max ever reached was 16,262,505 on November 25th 2021
  [https://bscscan.com/chart/tx](https://bscscan.com/chart/tx)
- This gives 16262505 / 86400 = **188.22 TPS**

##### Instructions to recreate this test

1. Install geth on the machine. geth is the command line interface for running a full Binance node. It is based on go-ethereum fork.
   1. wget https://github.com/binance-chain/bsc/releases/download/v1.1.7/geth_linux
   2. mv geth_linux geth
   3. chmod +x geth
   4. sudo geth /usr/local/bin/
2. Configure the Genesis block settings. Create genesis.json file in the parent folder and add the following content in the file. Be sure to replace the addresses with the accounts you created. Look into steps 8 and 9 for accounts creation.

   1. Create a genesis.json file like this.

      ```
      {
        "config": {
           "chainId": 1000,
           "homesteadBlock": 0,
           "eip155Block": 0,
           "eip158Block": 0,
        },
       "nonce": "0x0000000000000061",
       "timestamp": "0x0",
       "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
       "gasLimit": "0x8000000",
       "difficulty": "0x100",
       "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
       "coinbase": "0x3333333333333333333333333333333333333333",
       "alloc": {
           "0x3d3E0A9DdCC3348Fc81daDED2e72eC0CaC870ABD": {
               "balance": "100000000000000000000"
           },
           "0x9C89804E5BE2ae21D37692526A67ea9a9f9cCD0D": {
               "balance": "200000000000000000000"
           }
        }
      }
      ```

   2. Each node in the network must be initialised with the same genesis block.

3. Since we will be creating some nodes locally in our machine, we need to create 5 new directories under the parent folder. Each of them will represent a single node in the blockchain.
   - mkdir node01 node02 node03 node04 node05
4. Initialise and start the nodes. The first step is to initialise each node with the genesis file previously created. For this, run this command for each of the nodes, replacing with the correct path.
   - geth --datadir "/PATH_TO_NODE/" init /PATH_TO/genesis.json
5. (Optional) Generate initial account. Actually we can make many accounts with this method, but geth does not have a built-in feature of exporting the `private key` of the created account. And since we will be using a custom load testing tool for running transactions, we need private keys. So for now creating one account is enough which will be used for mining rewards.

   1. Create one account in the first node.
   2. geth --datadir "/PATH_TO_NODE01/" account new
   3. You will be prompted for a secret password. Write down the address of the created accounts and memorise the password.

6. Then start each node by running the following command for each of them. You will need to use different numbers both for the port and the rpcport.
   - geth --datadir "/PATH_TO_NODE/" --networkid 1000 --http --http.port "8001" --http.api "eth,net,web3,personal,miner,admin,debug" --port "30301" --nodiscover --syncmode "full" console 2>> "/PATH_TO_NODE/".log
   - "/PATH_TO_NODE/".log is where to look into the node’s logs ( Basically to get info how many txs processed in the block, block number, mining status, etc )
7. Connect to each node from the command line. In order to order with the nodes, we can use geth to attach to it.Run the following command for each of the nodes, in a separate terminal and use the correct port number for each of them. We will be using the first node as the admin node.
   1. geth attach [http://127.0.0.1:8000](http://127.0.0.1:8000)
   2. net.peerCount - to see how many nodes are peering in the admin node.
   3. admin.nodeInfo - will output the enode address. eg.
      - enode: enode://aae60455c342ac589953e88e7adbc8001c7fdc9ee995b03a9625573fe0b164d8067eb5795854aec3bfa24850a89aae6b8bfd24f221cfd68dde6b322a040080f6@127.0.0.1:30301?discport=0
   4. Now you can connect the other nodes to this one by running the following command in their respective terminals.
      - admin.addPeer("enode://aae60455c342ac589953e88e7adbc8001c7fdc9ee995b03a9625573fe0b164d8067eb5795854aec3bfa24850a89aae6b8bfd24f221cfd68dde6b322a040080f6@127.0.0.1:30301?discport=0")
   5. If we look into the admin node ( first node) now, we can see 4 other nodes connecting to it.
      - net.peerCount
        > 4
8. Start mining. The first thing to do is to set an account to receive the mining awards. If you have created an account with step 4, you can add the address of it here.
   1. First attach to the nodes with the respective ports 4. geth attach [http://127.0.0.1:8000](http://127.0.0.1:8000)
   2. miner.setEtherbase(eth.accounts[0])
   3. miner.start(1) - 1 is for 1 thread; default is 32.
   4. To check the balance of the account and see the mining rewards
      - eth.getBalance(eth.accounts[0])
9. Scripts Repo used for running transactions to the network
   1. [https://gitlab.com/shardeum/smart-contract-platform-comparison/binance](https://gitlab.com/shardeum/smart-contract-platform-comparison/binance)
   2. generate_accounts is for creating multiple accounts.
   3. spam.js is for running transactions to the network and check the average tps of each spam.
10. Generate multiple accounts. Add these addresses in the genesis file to reserve some balance. Also add these accounts’ private keys to the spam.js.
    1. npx hardhat generate --accounts [number]
    2. Copy the public addresses from the publicAddresses.json and add it in the genesis file to get some funds
    3. The spam-client will use their private keys from privateAddresses.json.
11. Spam the transactions. After each spam, follow step no. 12 to check the average tps
    1. npx hardhat spam --tps [number] --duration [number]
       - e.g. npx hardhat spam --tps 100 --duration 5
         i.e. 100 transactions per second for 5 seconds
    2. After the spam, take _lastBlockBeforeSpamming_ and totalTxs submiited to check average TPS of the spam.
12. Check the average tps of each spam.
    1. Get the lastBlockBeforeSpamming from the spam terminal.
    2. Get the total submitted Txs
       - e.g. spamming with --tps 100 --duration 5 will be 500
    3. npx hardhat check_tps --startblock [block_number] --txs [total_txs] --output [name.json]
       - npx hardhat check_tps --startblock 238 -- txs 500 – output s238t500.json
13. Some commands useful for getting information from the running node.
    - admin.nodeInfo
    - net.peerCount
    - eth.accounts
    - eth.getBlock(1)
    - eth.blockNumber
    - eth.getBalance(eth.accounts[0])
    - personal.unlockAccount(eth.accounts[0])
    - eth.sendTransaction({from:eth.accounts[0], to:eth.accounts[1], value:1000})
    - miner.setEtherbase(eth.accounts[0])
    - miner.start(1)
    - admin.addPeer(enode url)
