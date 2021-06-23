//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "./user_proxies/gelato_user_proxy/interfaces/IGelatoUserProxyFactory.sol";
import {
    GelatoUserProxy
} from "./user_proxies/gelato_user_proxy/GelatoUserProxy.sol";

contract AsianOpt {
    address immutable proxyFactory;
    address immutable condition;
    address immutable action;
    address payable public proxy;

    constructor(
        address _proxyFactory,
        address _condition,
        address _action
    ) public {
        proxyFactory = _proxyFactory;
        condition = _condition;
        action = _action;
    }

    function setProxy(address payable _proxy) public {
        proxy = _proxy;
    }

    function register() public returns (GelatoUserProxy userProxy) {
        userProxy = IGelatoUserProxyFactory(proxyFactory).create();
    }

    function setup(Action calldata _action) public payable {
        GelatoUserProxy(proxy).execAction{value: msg.value}(_action);
    }

    function buy(
        Provider calldata _provider,
        Task[] calldata _tasks,
        uint256 _expiryDate,
        uint256 _cycles
    ) public {
        GelatoUserProxy(proxy).submitTaskCycle(
            _provider,
            _tasks,
            _expiryDate,
            _cycles
        );
    }

    receive() external payable {}
}
