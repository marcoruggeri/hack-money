// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract OptNFT is ERC1155 {
    mapping(uint256 => string) public ipfsHashes;

    constructor() ERC1155("ipfs://") {}

    function mint(
        address account,
        uint256 tokenId,
        string ipfsHash
    ) external {
        _mint(account, tokenId, 1, "");
        ipfsHashes[tokenId] = ipfsHash;
    }
}
