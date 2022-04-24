//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//keyword "is" for inheriting from another solidity file

contract NFT is ERC721URIStorage {
    //increment counter for token ids. each nft needs a unique id
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;

    //constructor to set the address of the NFTMarket contract
    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddress = marketplaceAddress;
    }

    //function to mint new tokens. using modules from open zepplin
    function createToken(string memory _tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();
        //msg.sender is the address of the person that created the contract
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        //give marketplace approval to transaction the token between users
        setApprovalForAll(contractAddress, true);
        return newItemId; //need to return id to view in client app
    }
}
