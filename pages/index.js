import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
//web3 modal is library to connect to wallet
import Web3Modal from 'web3modal';
import { nftaddress, nftmarketaddress } from '../config';
//importing the ABIs
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
export default function Home() {
  const [nfts, setNfts] = useState([]);
  //state to show loading screen
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
  }, []);

  //function to make a call to the smart contracts on load
  async function loadNFTs() {
    //connecting to mumbsi netwrok for the contracts are deployed
    const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.matic.today");
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider);
    //getting all of the NFTs that are not sold
    const data = await marketContract.fetchMarketItems();
    
    //iterating through to get only the data we want
    const items = await Promise.all(data.map( async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      //get the meta data of the token from the infura url. needed to display the nft
      const meta = await axios.get(tokenUri);
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item;
    }));
    setNfts(items);
    setLoadingState('loaded');
  }
  //function to buy an NFT
  async function buyNFT(nft) {
    //creating the connection to the wallet
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    //write connection to NFT Market contract
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    //calling the create market sale from nft market contract
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {value: price});
    await transaction.wait();
    //re-load the nfts as one is less available in the market
    loadNFTs();
  }
  //if no items available in the market place
  if(loadingState === 'loaded' && !nfts.length) {
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  }
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px'}}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              //displaying the nfts
              nfts.map((nft, i) => {
                return (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img alt={nft.description} src={nft.image} />
                  <div className="p-4">
                      <p style={{ height: '64px'}} className="text-2xl font-semibold">{nft.name}</p>
                      <div style={{ height: '70px', overfloe: 'hidden'}}>
                        <p className="text-gray-400">{nft.description}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-black">
                      <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                      <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                      onClick={()=> buyNFT(nft)}>Buy</button>
                    </div>
                </div>
              )})
            }
          </div>
      </div>
    </div>
  )
}
