require("dotenv").config();
const { ethers } = require("ethers");
const GelatoCoreLib = require("@gelatonetwork/core");
const abi = require("../artifacts/contracts/AsianOpt.sol/AsianOpt.json").abi;
const abiTime = require("../artifacts/contracts/gelato_conditions/ConditionTimeStateful.sol/ConditionTimeStateful.json")
  .abi;

const GELATO_CORE_RKB = "0x733aDEf4f8346FD96107d8d6605eA9ab5645d632";
const UNISWAP_V2_Router_02_RKB = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_V2_Factory_RKB = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH_RKB = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const DAI_RKB = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";
const DAI_AMOUNT_PER_TRADE = ethers.utils.parseUnits("1", 18);
const TWO_MINUTES = 120;

const nowInSeconds = Math.floor(Date.now() / 1000);
const expiryDate = nowInSeconds + 90000; // 15 minutes from now

const provider = ethers.getDefaultProvider("rinkeby", {
  infura: "9b82b72329ac4374b79d232a088001d0",
});

const signer = new ethers.Wallet(process.env.PK, provider);

const con = new ethers.Contract(
  "0x5809B30C91eFfF1f84E9640948aDBa30A9FA7e33",
  abi,
  signer
);

const conditionTimeStateful = new ethers.Contract(
  "0x62E7CA7568f64AF6b747539c5CfDC81A0F8c3bb8",
  abiTime,
  signer
);

// SETUP
const fundsToDeposit = ethers.utils.parseEther("0.2");
// const actionAbiSetup = [
//   `function multiProvide(
//       address _executor,
//       TaskSpec[] calldata _taskSpecs,
//       IGelatoProviderModule[] calldata _modules
//    )`,
// ];
// const iFaceSetup = new ethers.utils.Interface(actionAbiSetup);

const iFace = new ethers.utils.Interface(GelatoCoreLib.GelatoCore.abi);

// Encode Multiprovide function of GelatoCore.sol
const multiProvideData = iFace.encodeFunctionData("multiProvide", [
  "0xa5A98a6AD379C7B578bD85E35A3eC28AD72A336b",
  [],
  ["0x66a35534126B4B0845A2aa03825b95dFaaE88B0C"],
]);
const userSetupAction = new GelatoCoreLib.Action({
  addr: GELATO_CORE_RKB,
  data: multiProvideData,
  operation: GelatoCoreLib.Operation.Call, // This Action must be called from the UserProxy
  value: fundsToDeposit,
  dataFlow: GelatoCoreLib.DataFlow.None, // Not relevant here
  termsOkCheck: false, // Not relevan here
});

// CONDITION
// let time;
// const getTimeData = async () => {
//   time = await conditionTimeStateful.getConditionData(
//     "0x0216063D3D40007FdFFe8015AE1e12a1fFf6FA4E"
//   );
//   console.log(time);
//   return time;
// };
// const celafamo = () => {
//   getTimeData();
// };
// const timeData = celafamo();
// console.log("time", time);
// console.log(timeData);
const timeData =
  "0xf1068afb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ba8677a5e2ad175c46f8e9ce65a5e5bfba3ddc82";
const conditionAddress = "0x62E7CA7568f64AF6b747539c5CfDC81A0F8c3bb8";
const conditionEvery2minutes = new GelatoCoreLib.Condition({
  inst: conditionAddress,
  data: timeData,
});

//ACTION
const tokenPath = [DAI_RKB, WETH_RKB];
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
  addr: UNISWAP_V2_Router_02_RKB,
  data: iFaceSwap.encodeFunctionData("swapExactTokensForTokens", [
    DAI_AMOUNT_PER_TRADE,
    0,
    tokenPath,
    "0x5809B30C91eFfF1f84E9640948aDBa30A9FA7e33",
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
const actionAbiApprove = [
  `function approve(
       address spender,
       uint256 amount,
   )`,
];
const iFaceApprove = new ethers.utils.Interface(actionAbiApprove);
const actionApproveUniswapRouter = new GelatoCoreLib.Action({
  addr: DAI_RKB,
  data: iFaceApprove.encodeFunctionData("approve", [
    UNISWAP_V2_Router_02_RKB,
    DAI_AMOUNT_PER_TRADE,
  ]),
  operation: GelatoCoreLib.Operation.Call, // This Action must be executed via the UserProxy
});
// TASK
const estimatedGasPerExecution = ethers.BigNumber.from("7000000"); // Limits the required balance of the User on Gelato to be 700.000 * GelatoGasPrice for every execution and not the default 8M
const taskTradeOnUniswap = new GelatoCoreLib.Task({
  // All the conditions have to be met
  conditions: [conditionEvery2minutes],
  // These Actions have to be executed in the same TX all-or-nothing
  actions: [
    actionApproveUniswapRouter,
    actionSwapTokensUniswap,
    actionUpdateConditionTime,
  ],
  selfProviderGasLimit: estimatedGasPerExecution, // We only want this execution to at most consume a gasLimit of "estimatedGasPerExecution"
  selfProviderGasPriceCeil: 0, // We want to execute this transaction no matter the current gasPrice
});
// GELATO PROVIDER OBJECT
const gelatoProvider = new GelatoCoreLib.GelatoProvider({
  addr: "0xbA8677a5e2aD175C46F8E9Ce65a5e5BfBA3DDC82",
  module: "0x66a35534126B4B0845A2aa03825b95dFaaE88B0C",
});

const buy = async () => {
  const tx = await con.buy(
    gelatoProvider,
    [taskTradeOnUniswap],
    expiryDate,
    3,
    {
      gasLimit: estimatedGasPerExecution,
    }
  );
  await tx.wait();
};

const setup = async () => {
  const tx = await con.setup(userSetupAction, {
    gasLimit: 500000,
    gasPrice: ethers.utils.parseUnits("10", "gwei"),
    value: fundsToDeposit, // The ETH will be transfered from the EOA to the userProxy and then deposited to Gelato
  });
  await tx.wait();
};

// setup();

buy();
