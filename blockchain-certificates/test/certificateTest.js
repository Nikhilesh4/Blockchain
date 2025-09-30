import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CertificateNFT", function () {
  let certificate, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    certificate = await ethers.deployContract("CertificateNFT", [owner.address]);
  });

  it("Should mint certificate only by owner", async function () {
    await expect(certificate.connect(user).mintCertificate(user.address, "ipfs://sampleURI"))
      .to.be.revertedWithCustomError(certificate, "OwnableUnauthorizedAccount");

    await certificate.mintCertificate(user.address, "ipfs://sampleURI");
    expect(await certificate.tokenIdCounter()).to.equal(1);
  });

  it("Should not allow transfer (soulbound)", async function () {
    await certificate.mintCertificate(user.address, "ipfs://sampleURI");
    await expect(certificate.connect(user).transferFrom(user.address, owner.address, 1))
      .to.be.revertedWith("This NFT is soulbound and non-transferable");
  });
});
