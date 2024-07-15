import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import Config from './config.json';

function App() {
  const [account, setaccount] = useState(null);
  const [provider, setprovider] = useState(null);
  const [toggle, setToggle] = useState(false);
  const [escrow, setescrow] = useState(null);
  const [home, sethome] = useState();

  const [homes, sethomes] = useState([]);

  let loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setprovider(provider)

    window.ethereum.on('accountsChanged', async () => {
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      let account = ethers.utils.getAddress(accounts[0]);
      setaccount(account);
    })

    const network = await provider.getNetwork();
    let realEstate = new ethers.Contract(Config[network.chainId].realEstate.address, RealEstate, provider);
    let totalsupply = await realEstate.totalSupply();


    const home = [];
    for (let i = 1; i <= totalsupply; i++) {
      let uri = await realEstate.tokenURI(i);
      let response = await fetch(uri);
      let metadata = await response.json();
      home.push(metadata)
    }


    sethomes(home)
    // console.log(homes);

    // console.log(network);
    const escrow = new ethers.Contract(Config[network.chainId].escrow.address, Escrow, provider)
    setescrow(escrow)
  }

  useEffect(() => {
    loadBlockchainData();
  }, []);

  let togglePop = (home) => {
    sethome(home)
    setToggle(!toggle)
  }

  return (
    <div>
      <Navigation account={account} setAccount={setaccount} />
      <Search />

      <div className='cards__section'>

        <h3>Home For You</h3>
        <hr />


        <div className='cards'>
          {
            homes && homes.map((home, index) => {
              return (
                <div className='card' key={index} onClick={() => {
                  togglePop(home)
                }}>
                  <div className='card__image'>
                    <img src={home.image} alt="Home" />
                  </div>
                  <div className='card__info'>
                    <h4>{home.attributes[0].value} ETH</h4>
                    <p>
                      <strong>{home.attributes[2].value}</strong> bds |
                      <strong>{home.attributes[3].value}</strong> ba |
                      <strong>{home.attributes[4].value}</strong> sqft
                    </p>
                    <p>{home.name}</p>
                  </div>
                </div>
              )
            })

          }

          {
            toggle &&
            <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
          }


        </div>

      </div>

    </div>
  );
}

export default App;
