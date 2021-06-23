const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const GelatoCoreLib = require("@gelatonetwork/core");

const UNISWAP_V2_Router_02 = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_V2_Factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const DAI_AMOUNT_PER_TRADE = ethers.utils.parseUnits("1", 18);
const TWO_MINUTES = 120;

const nowInSeconds = Math.floor(Date.now() / 1000);
const expiryDate = nowInSeconds + 900; // 15 minutes from now

let gelatoProvider;
let taskTradeOnUniswap;
let conditionTimeStateful;
let action;
let asianOpt;
let proxyFactory;
let accounts;

describe("AsianOpt", function () {
  before(async () => {
    accounts = await ethers.getSigners();
    const ConditionTimeStateful = await ethers.getContractFactory(
      "ConditionTimeStateful"
    );
    conditionTimeStateful = await ConditionTimeStateful.deploy(
      "0x025030bdaa159f281cae63873e68313a703725a5"
    );
    await conditionTimeStateful.deployed();

    const Action = await ethers.getContractFactory("ActionUniswapV2Trade");
    action = await Action.deploy(
      UNISWAP_V2_Router_02,
      UNISWAP_V2_Factory,
      WETH
    );
    await action.deployed();

    const AsianOpt = await ethers.getContractFactory("AsianOpt");
    asianOpt = await AsianOpt.deploy(
      "0xb0aa48f1eF1bF096140E1dA1c76D25151501608b",
      conditionTimeStateful.address,
      action.address
    );
    proxyFactory = await ethers.getContractAt(
      "IGelatoUserProxyFactory",
      "0xb0aa48f1eF1bF096140E1dA1c76D25151501608b"
    );
    // Create Proxy
    const tx = await asianOpt.register();
    await tx.wait();

    // CONDITION
    const conditionAddress = conditionTimeStateful.address;
    const conditionEvery2minutes = new GelatoCoreLib.Condition({
      inst: conditionAddress,
      data: await conditionTimeStateful.getConditionData(
        "0x97a84A6a8C222Be8BA5E7F9d54d9f113b13a6baf"
      ),
    });

    //ACTION
    const tokenPath = [DAI, WETH];
    const actionAbiSwap = [
      `function swapExactTokensForTokens(
          uint256 amountIn,
          uint256 amountOutMin,
          address[] calldata path,
          address to,
          uint256 deadline
      ) returns (uint256[] memory amounts)`,
    ];
    const iFaceSwap = new ethers.utils.Interface(actionAbiSwap);
    const actionSwapTokensUniswap = new GelatoCoreLib.Action({
      addr: UNISWAP_V2_Router_02,
      data: iFaceSwap.encodeFunctionData("swapExactTokensForTokens", [
        DAI_AMOUNT_PER_TRADE,
        0,
        tokenPath,
        asianOpt.address,
        4102448461,
      ]),
      operation: GelatoCoreLib.Operation.Call, // This Action must be executed via the UserProxy
    });
    const actionAbiTime = [
      `function setRefTime(
          uint256 _timeDelta,
          uint256 _idDelta,
      )`,
    ];
    const iFaceTime = new ethers.utils.Interface(actionAbiTime);
    const actionUpdateConditionTime = new GelatoCoreLib.Action({
      addr: conditionAddress,
      data: iFaceTime.encodeFunctionData("setRefTime", [
        TWO_MINUTES /* _timeDelta */,
        0,
      ]),
      operation: GelatoCoreLib.Operation.Call, // This Action must be called from the UserProxy
    });
    // TASK
    const estimatedGasPerExecution = ethers.BigNumber.from("700000"); // Limits the required balance of the User on Gelato to be 700.000 * GelatoGasPrice for every execution and not the default 8M
    taskTradeOnUniswap = new GelatoCoreLib.Task({
      // All the conditions have to be met
      conditions: [conditionEvery2minutes],
      // These Actions have to be executed in the same TX all-or-nothing
      actions: [actionSwapTokensUniswap, actionUpdateConditionTime],
      selfProviderGasLimit: estimatedGasPerExecution, // We only want this execution to at most consume a gasLimit of "estimatedGasPerExecution"
      selfProviderGasPriceCeil: 0, // We want to execute this transaction no matter the current gasPrice
    });
    // GELATO PROVIDER OBJECT
    gelatoProvider = new GelatoCoreLib.GelatoProvider({
      addr: "0x97a84A6a8C222Be8BA5E7F9d54d9f113b13a6baf",
      module: "0x4372692C2D28A8e5E15BC2B91aFb62f5f8812b93",
    });
  });
  it("test", async function () {
    await asianOpt.buy(gelatoProvider, [taskTradeOnUniswap], expiryDate, 3);
  });
});
