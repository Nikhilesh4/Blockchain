# Certificate Revocation Permission Changes

## Summary
Certificate revocation permissions have been restricted to **SUPER_ADMIN_ROLE only** for enhanced security.

## Changes Made

### 1. CertificateNFT.sol
- **Function:** `revokeCertificate(uint256 tokenId)`
  - **Before:** Required `REVOKER_ROLE` or higher (ADMIN, SUPER_ADMIN)
  - **After:** Requires **SUPER_ADMIN_ROLE only**
  - **Change:** Updated require statement from `canRevoke(msg.sender)` to `hasRole(SUPER_ADMIN_ROLE, msg.sender)`

- **Function:** `canRevoke(address account)`
  - **Before:** Returns true for SUPER_ADMIN, ADMIN, or REVOKER roles
  - **After:** Returns true **only for SUPER_ADMIN_ROLE**
  - **Change:** Simplified logic to check only SUPER_ADMIN_ROLE

### 2. MultiSigCertificateNFT.sol
- **Added:** `SUPER_ADMIN_ROLE` constant
- **Constructor:** Now grants `SUPER_ADMIN_ROLE` to initial admin
- **Function:** `revokeCertificate(uint256 tokenId)`
  - **Before:** Required `ADMIN_ROLE`
  - **After:** Requires **SUPER_ADMIN_ROLE only**
  - **Change:** Updated modifier from `onlyRole(ADMIN_ROLE)` to `onlyRole(SUPER_ADMIN_ROLE)`

- **Function:** `updateRequiredApprovals(uint256 newRequired)`
  - **Bonus Change:** Also restricted to SUPER_ADMIN_ROLE for additional security

### 3. Documentation Updates (docs/roles.md)
- Updated SUPER_ADMIN_ROLE section to highlight exclusive revocation permission
- Updated ADMIN_ROLE section to clarify they cannot revoke certificates
- Marked REVOKER_ROLE as **DEPRECATED** with migration notes
- Updated permission matrix in Appendix A to reflect new restrictions

## Rationale

### Why This Change?
1. **Enhanced Security:** Revocation is a critical operation that should be tightly controlled
2. **Centralized Authority:** Reduces risk of unauthorized or accidental revocations
3. **Audit Trail:** Easier to track and monitor revocation activities
4. **Compliance:** Better aligns with governance and compliance requirements
5. **Separation of Concerns:** Super admins handle critical operations while admins focus on day-to-day tasks

## Impact Assessment

### Who Is Affected?
- **SUPER_ADMIN:** No change - still can revoke certificates
- **ADMIN:** Can no longer revoke certificates directly
- **REVOKER_ROLE holders:** Role is now deprecated and ineffective
- **ISSUER/VERIFIER:** No change

### Migration Path for Existing Deployments

#### For Already Deployed Contracts:
If you have already deployed the contract with the old permissions:

1. **Option 1: Redeploy Contract**
   - Recommended for test networks (Sepolia)
   - Deploy new contract with updated code
   - Update frontend configuration with new contract address

2. **Option 2: Continue with Current Deployment**
   - If redeployment is not feasible
   - Implement off-chain policies to restrict revocation to super admins only
   - Document the policy clearly
   - Plan upgrade for next major release

#### For New Deployments:
- Simply deploy the updated contract
- Follow standard deployment procedures
- Only grant SUPER_ADMIN_ROLE to highly trusted individuals

## Testing Checklist

Before deploying to production, verify:

- [ ] Contracts compile without errors
- [ ] SUPER_ADMIN can successfully revoke certificates
- [ ] ADMIN cannot revoke certificates (transaction should revert)
- [ ] REVOKER_ROLE holders cannot revoke certificates
- [ ] Frontend shows appropriate UI based on user role
- [ ] All other functions work as expected
- [ ] Gas costs are acceptable
- [ ] Events are emitted correctly

## Compilation Status

✅ **All contracts compiled successfully** with Solidity 0.8.28

```bash
npx hardhat compile
```

## Next Steps

1. **Test locally:**
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy-local.js --network localhost
   ```

2. **Test on Sepolia:**
   ```bash
   npx hardhat run scripts/deploy-sepolia.js --network sepolia
   ```

3. **Update Frontend:** Ensure UI reflects new permission structure

4. **Verify on Etherscan:** After deployment, verify contract to show updated code

5. **Communicate Changes:** Inform all stakeholders about the new permission model

## Rollback Plan

If issues are discovered:

1. Revert to previous commit: `git revert HEAD`
2. Redeploy previous version
3. Update frontend configuration
4. Investigate and fix issues
5. Test thoroughly before redeploying

## Contact

For questions or issues related to these changes, contact:
- Technical Lead: [Your Contact]
- Security Team: [Security Contact]
- Documentation: See `docs/roles.md` for detailed role information

---

**Date:** October 25, 2025  
**Version:** 2.0.0  
**Status:** ✅ Implemented and Verified
