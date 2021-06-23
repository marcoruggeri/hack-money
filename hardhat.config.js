require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [{ version: "0.6.10" }],
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.FORKING_URL,
        // blockNumber: 11403245,
      },
    },
    rinkeby: {
      url: process.env.INF,
      accounts: [process.env.PK],
    },
    // mainnet: {
    //   url: process.env.MAINNET_URL,
    //   accounts: [process.env.PRIVATE_KEY_MAIN],
    // },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ES,
  },
};
