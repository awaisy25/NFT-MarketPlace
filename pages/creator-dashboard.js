import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
//web3 modal is library to connect to wallet
import Web3Modal from 'web3modal';
import { nftaddress, nftmarketaddress } from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function CreatorDashboard() {
    //one array for nfts created and one for items sold
    const [nfts, setNfts] = useState([]);
    const [sold, setSold] = useState([]);
    //state to show loading screen
    const [loadingState, setLoadingState] = useState('not-loaded');

    useEffect(() => {
        loadNFTs();
    }, []);

        //function to load nfts that the user owns
        async function loadNFTs() {
            //creating the connection to the wallet
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
            //need a signer for fecth My nfts since it has msg.sender in the contract function
            const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
    
            const data = await marketContract.fetchItemsCreated();
            //cleaning the data and setting in nfts state
            const items = await Promise.all(data.map(async i=> {
                const tokenUri = await tokenContract.tokenURI(i.tokenId);
                //get the meta data of the token from the infura url. needed to display the nft
                const meta = await axios.get(tokenUri);
                let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
                const item = {
                    price,
                    token: i.tokenId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    sold: i.sold,
                    image: meta.data.image,
                }
                return item;
            }));
            //items that have been sold
            const soldItems = items.filter(i=> i.sold);

            setNfts(items);
            setSold(soldItems);
            setLoadingState('loaded');
        }

        return (
            <div>
            <div className="px-4">
            <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {
                    //displaying the nfts
                    nfts.map((nft, i) => {
                      return (
                      <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <img alt={nft.description} src={nft.image} className="rounded"/>
                        <div className="p-4 bg-black">
                            <p className="text-2xl font-bold text-white">Price - {nft.price} MATIC</p>
                        </div>
        
                      </div>
                    )})
                  }
                </div>
            </div>
            <div className="px-4">
                {
                    Boolean(sold.length) && (
                       <div>
                           <h2 className="text-2xl py-2">Items sold</h2>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                               {
                                   sold.map((nft, i) => {
                                       return (
                                        <div key={i} className="border shadow rounded-xl overflow-hidden">
                                        <img alt={nft.description} src={nft.image} className="rounded"/>
                                        <div className="p-4 bg-black">
                                            <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                                        </div>
                                      </div>
                                       )
                                   })
                               }
                            </div>
                      </div>
                    )
                }
            </div>
          </div>
        )
}