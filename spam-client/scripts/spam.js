const fs = require('fs')
let ethers
let jsonRpcUrl = 'http://localhost:8001'
let provider

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true)
        }, ms)
    })
}

function getRandomWallet() {
    return ethers.Wallet.createRandom()
}

async function spam(injectedEthers, tps = 5, duration = 30) {
    ethers = injectedEthers
    provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
    let txCount = tps * duration
    const waitTime = (1 / tps) * 1000
    let lastTime = Date.now()
    let currentTime
    let sleepTime
    let elapsed
    let keys
    try {
        keys = JSON.parse(fs.readFileSync('privateAddresses.json', 'utf8'))
        console.log(
            `Loaded ${keys.length} account${keys.length > 1 ? 's' : ''
            } from accounts.json`
        )
    } catch (error) {
        console.log(`Couldn't load accounts from file: ${error.message}`)
        return
    }
    const filteredAccounts = keys.slice(0, txCount)
    const signedTxs = []
    for (let i = 0; i < filteredAccounts.length; i++) {
        let senderWallet = new ethers.Wallet(filteredAccounts[i])
        let nonce = await provider.getTransactionCount(senderWallet.address)
        const { chainId } = await provider.getNetwork()
        let amountInEther = '1'
        let receiverAddress = getRandomWallet().address
        let tx = {
            nonce: nonce,
            chainId: chainId,
            to: receiverAddress,
            value: ethers.utils.parseEther(amountInEther),
            gasLimit: 210000,
        }
        let signedTx = await senderWallet.signTransaction(tx)
        signedTxs.push(signedTx)
    }
    let lastBlockBeforeSpamming = await provider.getBlockNumber()
    let spamStartTime = Math.floor(Date.now() / 1000)
    console.log('lastBlockBeforeSpamming', lastBlockBeforeSpamming)
    console.log('startTime', spamStartTime)

    for (let i = 0; i < signedTxs.length; i++) {
        // console.log('Injected tx:', i + 1)
        try {
            let result = provider.sendTransaction(signedTxs[i])
            // console.log('result', result)
        } catch (e) {
            console.log(e)
        }
        currentTime = Date.now()
        elapsed = currentTime - lastTime
        sleepTime = waitTime - elapsed
        if (sleepTime < 0) sleepTime = 0
        await sleep(sleepTime)
        lastTime = Date.now()
    }
    let spamEndTime = Math.floor(Date.now() / 1000)
    var timeDiff = spamEndTime - spamStartTime; //in ms

    var seconds = Math.round(timeDiff);
    let lastBlockAfterSpamming = await provider.getBlockNumber()
    console.log('lastBlockAfterSpamming', lastBlockAfterSpamming)
    console.log('totalSpammingTime', seconds)
}

async function checkTps(injectedEthers, startBlock, totalTXs, fileToSave) {
    ethers = injectedEthers
    provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
    let startTime
    let endTime
    let endBlock
    let totalTransactions = 0
    let i = 0
    for (i = startBlock; totalTransactions < totalTXs; i++) {
        let block = await provider.getBlock(i)
        if (!block) break
        let { timestamp, transactions } = block
        block.transactionsSize = transactions.length
        if (i === startBlock) {
            startTime = timestamp
        }
        if (transactions.length > 0) {
            endBlock = block.number
            endTime = timestamp
            totalTransactions += parseInt(transactions.length)
        }
        fs.appendFile(fileToSave, JSON.stringify(block, null, 2), function (err) {
            if (err) throw err;
        });
    }
    let averageTime = endTime - startTime;
    let avgTPS = totalTransactions / averageTime;
    console.log('startBlock', startBlock, 'endBlock', endBlock)
    console.log(`total time`, averageTime)
    console.log(`total txs:`, totalTransactions)
    console.log(`avg tps`, avgTPS)
}

module.exports = { spam, checkTps }
