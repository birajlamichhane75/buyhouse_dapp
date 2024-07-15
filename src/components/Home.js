import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, togglePop }) => {
    const [buyer, setbuyer] = useState();
    const [seller, setseller] = useState();
    const [lender, setlender] = useState();
    const [inspector, setinspector] = useState();

    const [hasbought, sethasbought] = useState(false);
    const [lended, setlended] = useState(false);
    const [hasInspected, sethasInspected] = useState(false);
    const [sold, setsold] = useState(false);

    const [owner, setowner] = useState(null);


    let fetchDetails = async () => {

        let buyer = await escrow.buyer(home.id);
        setbuyer(buyer)
        let hasbought = await escrow.approval(home.id, buyer)
        sethasbought(hasbought)

        let seller = await escrow.seller();
        setseller(seller)
        let sold = await escrow.approval(home.id, seller)
        setsold(sold)

        let lender = await escrow.lender();
        setlender(lender)
        let lended = await escrow.approval(home.id, lender)
        setlended(lended)

        let inspector = await escrow.inspector();
        setinspector(inspector)
        let hasInspected = await escrow.inspection(home.id)
        sethasInspected(hasInspected)
    }

    let fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return;

        let owner = await escrow.buyer(home.id)
        setowner(owner)
    }




    useEffect(() => {
        fetchDetails();
        fetchOwner();
    }, [sold]);


    const buyHandler = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id);
        const signer = await provider.getSigner();

        let transaction = await escrow.connect(signer).depositFund(home.id, { value: escrowAmount })
        await transaction.wait();

        transaction = await escrow.connect(signer).approved(home.id);
        await transaction.wait();

        sethasbought(true);
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner();

        const transaction = await escrow.connect(signer).inspectionStatus(home.id, true);
        await transaction.wait();

        sethasInspected(true)
    }

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await escrow.connect(signer).approved(home.id)
        await transaction.wait()

        // Lender sends funds to contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })

        setlended(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        let transaction = await escrow.connect(signer).approved(home.id)
        await transaction.wait()

        // Seller finalize...
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setsold(true)
    }

    return (
        <div className="home">
            <div className='home__details'>
                <div className="home__image">
                    <img src={home.image} alt="Home" />
                </div>
                <div className="home__overview">
                    <h1>name</h1>
                    <p>
                        <strong>{home.attributes[2].value}</strong> bds |
                        <strong>{home.attributes[3].value}</strong> ba |
                        <strong>{home.attributes[4].value}</strong> sqft
                    </p>
                    <p>{home.address}</p>

                    <h2>{home.attributes[0].value} ETH</h2>
                    {/* <div className='home__owned'>
                            
                        </div> */}
                    <div>
                        {(account === inspector) ? (
                            <button className='home__buy' onClick={inspectHandler} disabled={hasInspected}>
                                Approve Inspection
                            </button>
                        ) : (account === lender) ? (
                            <button className='home__buy' onClick={lendHandler} disabled={lended}>
                                Approve & Lend
                            </button>
                        ) : (account === seller) ? (
                            <button className='home__buy' onClick={sellHandler} disabled={sold}>
                                Approve & Sell
                            </button>
                        ) : (
                            <button className='home__buy' onClick={buyHandler} disabled={hasbought}>
                                Buy
                            </button>
                        )}

                        <button className='home__contact'>Contact Agent</button>
                    </div>



                    <hr />

                    <h2>Overview</h2>

                    <p>
                        {home.description}
                    </p>
                    <hr />

                    <h2>Facts and features</h2>


                </div>
                <button onClick={togglePop} className="home__close">
                    <img src={close} alt="Close" />
                </button>
            </div>
        </div >
    );
}

export default Home;
