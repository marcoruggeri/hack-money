// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const GELATO_CORE_RKB = "0x733aDEf4f8346FD96107d8d6605eA9ab5645d632";
  const UNISWAP_V2_Router_02_RKB = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNISWAP_V2_Factory_RKB = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const WETH_RKB = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
  const DAI_RKB = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";

  // We get the contract to deploy
  // const ConditionTimeStateful = await hre.ethers.getContractFactory(
  //   "ConditionTimeStateful"
  // );
  // const conditionTimeStateful = await ConditionTimeStateful.deploy(
  //   GELATO_CORE_RKB
  // );
  // await conditionTimeStateful.deployed();

  // const Action = await ethers.getContractFactory("ActionUniswapV2Trade");
  // const action = await Action.deploy(
  //   UNISWAP_V2_Router_02_RKB,
  //   UNISWAP_V2_Factory_RKB,
  //   WETH_RKB
  // );
  // await action.deployed();

  const AsianOpt = await ethers.getContractFactory("AsianOpt");
  const asianOpt = await AsianOpt.deploy(
    "0x0309EC714C7E7c4C5B94bed97439940aED4F0624",
    "0x62E7CA7568f64AF6b747539c5CfDC81A0F8c3bb8",
    "0x76A8CEbEEce5BF5A4e16C87B3ca99703a9E6C911"
  );
  await asianOpt.deployed();

  // console.log(
  //   "conditionTimeStateful deployed to:",
  //   conditionTimeStateful.address
  // );
  // console.log("action deployed to:", action.address);
  console.log("asianOpt deployed to:", asianOpt.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
