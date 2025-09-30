import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const nft = await CertificateNFT.deploy(deployer.address);
    
    // Wait for deployment to complete (ethers v6 syntax)
    await nft.waitForDeployment();

    console.log("CertificateNFT deployed to:", await nft.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
