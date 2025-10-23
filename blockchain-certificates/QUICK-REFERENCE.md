# Quick Reference: Two-Tier Role System

## ✅ WORKING - All 85 Tests Passing!

## Role Hierarchy (Simple View)

```
SUPER_ADMIN (Deployer)
    ├─ Can grant: ADMIN, ISSUER, REVOKER, VERIFIER
    ├─ Can mint certificates
    ├─ Can revoke certificates
    └─ Emergency powers (pause contract)

ADMIN
    ├─ Can grant: ISSUER, REVOKER, VERIFIER only
    ├─ Can mint certificates
    ├─ Can revoke certificates
    └─ Day-to-day management

ISSUER
    └─ Can only mint certificates

REVOKER
    └─ Can only revoke certificates

VERIFIER
    └─ Read-only access
```

## Code Examples

### SUPER_ADMIN grants ADMIN role
```javascript
await contract.connect(superAdmin).grantRole(ADMIN_ROLE, adminAddress);
```

### SUPER_ADMIN grants ISSUER role (direct)
```javascript
await contract.connect(superAdmin).grantRole(ISSUER_ROLE, issuerAddress);
```

### ADMIN grants ISSUER role
```javascript
await contract.connect(admin).grantRole(ISSUER_ROLE, issuerAddress);
```

### ADMIN tries to grant ADMIN role (FAILS ❌)
```javascript
await contract.connect(admin).grantRole(ADMIN_ROLE, newAdmin);
// Error: Only SUPER_ADMIN can grant ADMIN_ROLE
```

## What Changed?

### OLD (Broken)
- Only SUPER_ADMIN could grant ISSUER/REVOKER/VERIFIER
- ADMIN couldn't grant any roles
- Error: "missing revert data" when SUPER_ADMIN tried to grant ISSUER

### NEW (Working)
- SUPER_ADMIN can grant ALL roles (including ADMIN)
- ADMIN can grant ISSUER, REVOKER, VERIFIER
- Custom grantRole/revokeRole functions
- Proper two-tier hierarchy

## Testing in Frontend

1. **Connect as SUPER_ADMIN** (deployer wallet)
2. **Grant ADMIN_ROLE** to another address
3. **Connect as ADMIN**
4. **Grant ISSUER_ROLE** to test user
5. **Verify it works!** ✅

## Deploy to Apply Changes

```bash
# Terminal 1: Start node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

## Summary
- ✅ Two-tier hierarchy implemented
- ✅ All tests passing (85/85)
- ✅ SUPER_ADMIN can grant all roles
- ✅ ADMIN can grant lower roles
- ✅ Production ready!
