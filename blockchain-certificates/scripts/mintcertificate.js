import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    const [owner] = await ethers.getSigners(); // Deployer account

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your contract address
    const recipient = "0xcd3b766ccdd6ae721141f452c550ca635964ce71"; // Replace with the recipient's wallet
    const metadataURI = "ipfs://QmfCNWTJVyQQ1WDhjbzbzdo1g9wpYqPEALWMjxsPqQgZBr"; // Replace with your metadata URI from Pinata

    // Connect to the deployed contract
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const certificate = CertificateNFT.attach(contractAddress);

    // Mint the certificate NFT
    const tx = await certificate.mintCertificate(recipient, metadataURI);
    await tx.wait(); // Wait for the transaction to be mined

    console.log("Certificate NFT minted successfully!");
    console.log("Recipient:", recipient);
    console.log("Metadata URI:", metadataURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
