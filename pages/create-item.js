import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
//library to connect to ipfs provider
import { create as ipfsHttpClient } from 'ipfs-http-client';
//web3 modal is library to connect to wallet
import Web3Modal from 'web3modal';
import { nftaddress, nftmarketaddress } from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
//connecting to infura client
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

export default function CreateItem () {
    //state from the input of the form
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({price: '', name: '', description: ''});

    const router = useRouter();

    //function for form change
    async function onChange(e) {
        const file = e.target.files[0];
        try {
            //retreiving the ipfs url from infura
            const added = await client.add(
                file, //progress callback
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
                );
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileUrl(url);
        } catch(error) {
            console.log(error);
        }
    }

    //function to create an item to ipfs
    async function createItem() {
        const { name, description, price } = formInput;
        if (!name || !description || !price || !fileUrl) return
        const data = JSON.stringify({
            name, description, image: fileUrl
        });
        try {
            //submitting the whole file data to infura
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            createSale(url);
        }
        catch(error) {
            console.log("Error uploading file: ", error);
        }
    }
    //function to mint the NFT
    async function createSale(url) {
        //connecting to the users wallet
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        //creating instance of nft contract then minting the token by passing in the ipfs url
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);

        let tx = await transaction.wait();
        //have to dig in the data to find the token id
        //console.log('transaction:', JSON.stringify(tx));
        let event = tx.events[0];
        let value = event.args[2];
        const tokenId = value.toNumber();

        const price = ethers.utils.parseUnits(formInput.price, 'ether');
        
        //creating an instance of market contract then creating a new market item
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
         //get listing price from the contract
        const listingPrice = await contract.getListingPrice();
        transaction - await contract.createMarketItem(nftaddress, tokenId, price, {value: listingPrice});

        await transaction.wait();
        //once finished re-route to home page
        router.push('/');
    }

    //returning the ui
    return (
        <div className="flex justify-center">
            <div className="1-1/2 flex flex-col pb-12">
        <input
            placeholder='Asset Name'
            className="mt-8 border rounder p-4"
            onChange={e => updateFormInput({...formInput, name: e.target.value})}
        />
        <textarea
            placeholder='Asset Description'
            className="mt-2 border rounder p-4"
            onChange={e => updateFormInput({...formInput, description: e.target.value})}
        />
        <input
            placeholder='Asset Price in Matic'
            className="mt-2 border rounder p-4"
            onChange={e => updateFormInput({...formInput, price: e.target.value})}
        />
        <input 
            type="file"
            name="Asset"
            className="my-4"
            onChange={onChange}
        />
        {
            //if there is an image upload then show a preview
            fileUrl && (
                <img alt="asset preview" className="rounder mt-4" width="350" src={fileUrl} />
            )
        }
        <button 
            onClick={createItem} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
            Create Digital Asset
            </button>
            </div>
        </div>
    )
}