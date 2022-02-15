/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-waffle')

let { spam, checkTps } = require('./scripts/spam')
let { generate } = require('./scripts/generate_accounts')
const { task } = require('hardhat/config')

task('spam', 'Spam the network')
    .addParam('tps', 'Transaction injected per second')
    .addParam('duration', 'Spam duration in seconds')
    .setAction(async (taskArgs, hre) => {
        let tps = parseInt(taskArgs.tps)
        let duration = parseInt(taskArgs.duration)
        await spam(hre.ethers, tps, duration)
    })

task('generate', 'Generate multiple accounts.')
    .addParam('accounts', 'Transaction injected per second')
    .setAction(async (taskArgs, hre) => {
        let accounts = parseInt(taskArgs.accounts)
        await generate(hre.ethers, accounts)
    })

task('tps_check', 'Check the TPS')
    .addParam('startblock', 'Transaction injected per second')
    .addParam('txs', 'amount of transactions from the spam run')
    .addParam('output', 'file to save the log')
    .setAction(async (taskArgs, hre) => {
        let startblock = parseInt(taskArgs.startblock)
        let txs = parseInt(taskArgs.txs)
        let output = taskArgs.output
        await checkTps(hre.ethers, startblock, txs, output)
    })

module.exports = {
    solidity: '0.8.0',
    defaultNetwork: 'ethereum',
    networks: {
        hardhat: {
            gas: 'auto'
        },
        ropsten: {
            url: `https://ropsten.infura.io/v3/1f65d32ffe4547abae06d368e34f10ca`,
            accounts: [
                '04efbdf66c7e74e649829413053ed604a54c921b60df61c08a52d22280c1d63a'
            ]
        },
        ethereum: {
            url: 'http://localhost:8001',
            chainId: 1000,
            accounts: [
                '0x6dcff87be870e231b151cccbf55248bc49815a137859def0d5c98d76fb2fab3c'// put your account private key. Don't
                // push to repo
            ]
        }
    }
}
