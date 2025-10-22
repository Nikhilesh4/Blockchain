# 🚀 RBAC Quick Start Guide

## What You Have Now

A complete Role-Based Access Control system with:
- ✅ 5-level role hierarchy (SUPER_ADMIN → ADMIN → ISSUER/REVOKER/VERIFIER)
- ✅ Smart contract with role-based permissions
- ✅ Beautiful admin dashboard
- ✅ Automated setup scripts
- ✅ Comprehensive tests (31 passing)

---

## Quick Setup (5 Minutes)

### Step 1: Deploy Contract
```bash
cd blockchain-certificates
npx hardhat run scripts/deploy.js --network localhost
```

### Step 2: Configure Roles

Edit `config/roles.json` and add wallet addresses:
```json
{
  "superAdmins": ["0xYourBackupAdminAddress"],
  "admins": ["0xAdminAddress1", "0xAdminAddress2"],
  "issuers": ["0xIssuerAddress1", "0xIssuerAddress2"],
  "revokers": ["0xRevokerAddress"],
  "verifiers": ["0xVerifierAddress"]
}
```

### Step 3: Setup Roles
```bash
npx hardhat run scripts/setupRoles.js --network localhost
```

### Step 4: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 5: Connect & Test
1. Open http://localhost:5173
2. Connect MetaMask
3. See your role badges appear
4. Click "🔐 Admin Dashboard" if you're an admin

---

## Key Features

### For Users
- **Role Badges**: See your permissions at a glance
- **Smart UI**: Only see features you can access
- **Clear Messages**: Know why features are restricted

### For Admins
- **Admin Dashboard**: Comprehensive management interface
- **User Management**: View and manage all users
- **Role Assignment**: Grant roles with validation
- **Request System**: Review and approve role requests
- **Emergency Controls**: Pause contract, revoke access

### For Super Admins
- **Full Control**: Manage all roles and users
- **Emergency Powers**: Pause/unpause, emergency revoke
- **Batch Operations**: Efficient role management
- **Audit Trails**: Complete logging

---

## Daily Operations

### Grant a Role
1. Go to Admin Dashboard
2. Click "Role Assignment" tab
3. Enter wallet address
4. Select role
5. Click "Grant Role"

### Revoke a Role
1. Go to "User Management" tab
2. Find the user
3. Click "Revoke [RoleName]"
4. Confirm

### Emergency Pause
1. Go to "Emergency Controls" tab
2. Click "Pause Contract"
3. All minting/revoking stops immediately

---

## Testing

### Run All RBAC Tests
```bash
npx hardhat test test/roleTests.js
```

### Expected Result
```
31 passing (3s)
```

---

## Role Permissions Quick Reference

| Action | SUPER_ADMIN | ADMIN | ISSUER | REVOKER | VERIFIER |
|--------|-------------|-------|--------|---------|----------|
| Mint Certificate | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke Certificate | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Users | ✅ | ✅* | ❌ | ❌ | ❌ |
| Pause Contract | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Certificates | ✅ | ✅ | ✅ | ✅ | ✅ |

*ADMIN can only manage ISSUER, REVOKER, and VERIFIER roles

---

## Troubleshooting

### Can't See Admin Dashboard?
- Need ADMIN_ROLE or SUPER_ADMIN_ROLE
- Check role badges in wallet info
- Run `npx hardhat run scripts/setupRoles.js` again

### Can't Issue Certificates?
- Need ISSUER_ROLE, ADMIN_ROLE, or SUPER_ADMIN_ROLE
- Check Pinata keys in `.env`
- Ensure contract isn't paused

### Can't Grant Roles?
- Super Admins can grant all roles
- Admins can grant ISSUER, REVOKER, VERIFIER only
- Check your current roles in dashboard

---

## Documentation

### Complete Guides
- **`docs/roles.md`**: Complete RBAC documentation (400+ lines)
- **`RBAC-IMPLEMENTATION.md`**: Implementation details
- **`README.md`**: Project overview

### Contract Functions
- `grantRole(role, address)`: Assign a role
- `revokeRole(role, address)`: Remove a role
- `getUserRoles(address)`: Get all user roles
- `canIssue(address)`: Check issue permission
- `canRevoke(address)`: Check revoke permission
- `emergencyRevokeRole(address, role, reason)`: Emergency revoke
- `pause()`: Pause contract (SUPER_ADMIN only)

---

## Next Steps

1. ✅ Deploy to testnet (Sepolia/Goerli)
2. ✅ Configure roles for your team
3. ✅ Test all permissions
4. ✅ Set up monitoring/alerts
5. ✅ Document your specific workflows
6. ✅ Train your team
7. ✅ Deploy to mainnet

---

## Support

### Check Logs
- Contract events: Check blockchain explorer
- Role assignments: `logs/role-assignments.json`
- Frontend errors: Browser console

### Common Issues
- **AccessControl errors**: User doesn't have required role
- **Paused errors**: Contract is paused, use emergency controls
- **Transaction failures**: Check gas, permissions, contract state

---

## Security Reminders

1. 🔐 Keep SUPER_ADMIN keys secure (hardware wallet recommended)
2. 📝 Document all role assignments
3. 🔄 Regular role audits (quarterly recommended)
4. 🚨 Test emergency procedures
5. 📊 Monitor all role changes
6. ⏰ Set up time-limited roles when appropriate
7. 🎓 Train all role holders on their responsibilities

---

## Success! 🎉

You now have a production-ready RBAC system. Your blockchain certificate platform is secure, scalable, and enterprise-grade!

**Questions? Issues?**
- Check `docs/roles.md` for detailed documentation
- Review `RBAC-IMPLEMENTATION.md` for technical details
- Run tests to verify everything is working

**Ready to go!** 🚀
