//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
//code for security control to prevent re-entry attacks
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
//inheriting from open zeplin ReentrancyGuard
contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    //increment variable for item ids and number of items sold
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint listingPrice = 0.025 ether;
    
    //constructor is to set the owner for when the contract is created
    constructor() {
        owner = payable(msg.sender);
    }
    //struct is like an object. this object is for each NFT listed on the market
    struct MarketItem {
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }
    //have market items in mapping data structure
    mapping(uint => MarketItem) private idToMarketItem;

    //log when a market item is created
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool sold
    );

    //function to return the listing price
    function getListingPrice() public view returns(uint) {
        return listingPrice;
    }
    //function to create a market item. nonReentrant is open zepplin to prevent re-entry attacks
    function createMarketItem(address nftContract, uint tokenId, uint price) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 Wei");
        //making sure someone passing in their nft is paying the listing price
        require(msg.value == listingPrice, "Price must be equal to listing price");

        //increment id
        _itemIds.increment();
        uint itemId = _itemIds.current();

        //creating the market item object and set mapping by its id
        idToMarketItem[itemId] = MarketItem(
            itemId, 
            nftContract, 
            tokenId, 
            payable(msg.sender), 
            payable(address(0)), //zero address is empty address, because no owner when putting it up for sale
            price, 
            false);
        //transferring the nft contract from the person who created the contract to the contracts address
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

         //log the event
        emit MarketItemCreated(
        itemId,
            nftContract, 
            tokenId, 
            msg.sender, 
            address(0), 
            price,
            false
            );
    }

    //function to allow someone to buy the market item. nonReentrant is open zepplin to prevent re-entry attacks
    function createMarketSale(address nftContract, uint itemId) public payable nonReentrant {
        //getting the price and token id by indexing in idToMarketItem map
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price, "Please submit the asking price in order to compelte the purchase");
        //transfer the money from the buyer to the orginal person that put up the nft for sale
        idToMarketItem[itemId].seller.transfer(msg.value);
        //transfer the nft from the contract to the person buying it
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        //setting the owner of the market item
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        //incrementing the number of items sold
        _itemsSold.increment();
        //pay the owner of the smart contract
        payable(owner).transfer(listingPrice);
    }

    //view for all of the available market items
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        //total number of items that are still available
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        //array to loop through the items and get the ones that are unsold. unsold one have an empty address for owner attribute
        MarketItem[] memory items  = new MarketItem[](unsoldItemCount);

        for(uint i = 0; i < itemCount; i++) {
            if(idToMarketItem[i + 1].owner == address(0)) {
                //getting the market item in the loop and storing it in the items array
                uint currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++; //incrementing the index of the array
            }
        }
        return items;
    }

    //function to retrieve the nfts a user has purchased
    function fetchMynfts() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        //counting the number of items the user owns
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i + 1].owner == msg.sender) {
                itemCount++;
            }
        }
        //storing the items the user owns in array and returning them
        MarketItem[] memory items = new MarketItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].owner == msg.sender) {
                //getting the market items in the loop and storing it in the items array
                uint currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
       return items;
    }
    
    //function to retrieve the nfts a user has created
    function fetchItemsCreated() public view returns(MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        //counting the number of items the user created
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i + 1].seller == msg.sender) {
                itemCount++;
            }
        }
        //storing the items the user created in array and returning them
        MarketItem[] memory items = new MarketItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].seller == msg.sender) {
                //getting the market items in the loop and storing it in the items array
                uint currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
       return items;
    }

}

