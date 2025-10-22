# Role-Based Access Control (RBAC) Documentation

## Overview
This document describes the role hierarchy, permissions, and management processes for the Certificate NFT system.

## Role Hierarchy

```
SUPER_ADMIN_ROLE (Top Level)
├── ADMIN_ROLE (Administrative Level)
│   ├── ISSUER_ROLE (Operational Level)
│   └── REVOKER_ROLE (Operational Level)
└── VERIFIER_ROLE (Read-Only Level)
```

## Role Definitions

### 1. SUPER_ADMIN_ROLE
**Purpose:** Highest level of control with full system management capabilities.

**Permissions:**
- Grant and revoke all other roles (including ADMIN_ROLE)
- Emergency pause/unpause contract functionality
- Modify critical contract parameters
- Manage admin accounts
- Access all administrative functions
- Override emergency situations

**Who Should Have This Role:**
- Contract deployer (initially)
- C-level executives
- System architects
- Maximum 2-3 individuals

**Security Considerations:**
- Should be held by multi-signature wallets
- Requires highest level of operational security
- Subject to mandatory 2FA and hardware wallet requirements

---

### 2. ADMIN_ROLE
**Purpose:** Day-to-day administrative control without critical system-level access.

**Permissions:**
- Issue (mint) certificates
- Revoke certificates
- View all certificates
- Manage ISSUER_ROLE and REVOKER_ROLE assignments
- Access administrative dashboard
- Generate reports and analytics

**Who Should Have This Role:**
- Department heads
- Senior administrators
- Operations managers
- Typically 5-10 individuals

**Security Considerations:**
- Regular security audits
- Activity logging and monitoring
- Quarterly access reviews

---

### 3. ISSUER_ROLE
**Purpose:** Specialized role for certificate issuance only.

**Permissions:**
- Mint/issue new certificates to recipients
- View issued certificates
- Access issuance dashboard
- Verify certificate details (read-only)

**Restrictions:**
- Cannot revoke certificates
- Cannot manage other users
- Cannot modify existing certificates

**Who Should Have This Role:**
- Certificate coordinators
- Educational administrators
- HR personnel
- Event organizers
- Typically 10-20 individuals

**Use Cases:**
- University registrars issuing degree certificates
- HR teams issuing employment certificates
- Training departments issuing course completion certificates

---

### 4. REVOKER_ROLE
**Purpose:** Specialized role for certificate revocation only.

**Permissions:**
- Revoke existing certificates
- View certificate revocation history
- Access revocation dashboard
- Verify certificate status (read-only)

**Restrictions:**
- Cannot issue new certificates
- Cannot manage other users
- Cannot unrevoker certificates (permanent action)

**Who Should Have This Role:**
- Compliance officers
- Legal team members
- Security personnel
- Typically 3-5 individuals

**Use Cases:**
- Revoking certificates due to fraud detection
- Invalidating certificates for policy violations
- Academic misconduct cases
- Employment termination scenarios

---

### 5. VERIFIER_ROLE
**Purpose:** Read-only access for verification purposes.

**Permissions:**
- Verify certificate authenticity
- View certificate details
- Check revocation status
- Access verification dashboard

**Restrictions:**
- No write operations
- Cannot issue or revoke certificates
- Cannot manage users
- Cannot access sensitive administrative data

**Who Should Have This Role:**
- External verifiers (employers, institutions)
- Audit teams
- Third-party verification services
- Public verification interfaces (with rate limiting)

**Use Cases:**
- Employers verifying candidate credentials
- Universities verifying transfer credits
- Professional bodies verifying certifications
- Background check services

---

## Role Assignment Process

### Initial Role Distribution (Deployment)

1. **Contract Deployment**
   - Deployer automatically receives SUPER_ADMIN_ROLE
   - Deployer is set as DEFAULT_ADMIN_ROLE admin

2. **Immediate Post-Deployment** (Within 24 hours)
   ```
   Step 1: Assign additional SUPER_ADMIN to backup wallet
   Step 2: Assign ADMIN_ROLE to key personnel
   Step 3: Document all assignments in secure location
   Step 4: Test each role's permissions
   Step 5: Enable monitoring and logging
   ```

3. **Documentation Requirements**
   - Record wallet addresses
   - Record role assignments
   - Record assignment timestamps
   - Store in encrypted, access-controlled system

---

### Role Request Workflow

#### For New Role Requests:

1. **Request Submission**
   ```
   User fills request form with:
   - Wallet address
   - Requested role
   - Justification
   - Supervisor approval
   - Expected duration (if temporary)
   ```

2. **Review Process**
   - Request logged on-chain (event emission)
   - Email notification sent to all SUPER_ADMINs
   - Request tracked in admin dashboard

3. **Approval Process**
   ```
   For ISSUER_ROLE or REVOKER_ROLE:
   - ADMIN_ROLE or higher can approve
   - Single approval sufficient
   
   For ADMIN_ROLE:
   - Requires SUPER_ADMIN_ROLE approval
   - Optional: Implement multi-sig approval
   
   For SUPER_ADMIN_ROLE:
   - Requires unanimous SUPER_ADMIN approval
   - Mandatory off-chain verification
   - Legal compliance check
   ```

4. **Assignment Execution**
   - Role granted via `grantRole()` function
   - Event emitted for audit trail
   - User notified via email
   - Access granted to relevant interfaces

5. **Post-Assignment**
   - Training materials provided
   - Access verified through test transactions
   - Added to role distribution list
   - Monitoring enabled for new user

---

### Role Review Process

#### Quarterly Role Audits

**Schedule:** Every 3 months (Jan, Apr, Jul, Oct)

**Process:**
1. **Generate Role Report**
   - List all addresses with roles
   - Review activity logs
   - Identify inactive accounts (no activity in 90 days)

2. **Review Criteria**
   - Is the user still in the appropriate position?
   - Has there been any suspicious activity?
   - Is the role still necessary?
   - Should role be upgraded/downgraded?

3. **Actions Taken**
   - Revoke roles for inactive accounts
   - Revoke roles for terminated employees
   - Upgrade roles if justified
   - Renew roles for continued access

4. **Documentation**
   - Audit report generated
   - Changes documented with justification
   - All stakeholders notified
   - Compliance report filed

#### Annual Security Rotation
- Rotate SUPER_ADMIN keys annually
- Update multi-sig signers
- Review and update security policies
- Conduct penetration testing

---

### Emergency Role Revocation

#### Immediate Revocation Scenarios

**Trigger Conditions:**
- Suspected wallet compromise
- Detected malicious activity
- Employee termination (for cause)
- Lost/stolen private keys
- Unusual transaction patterns
- Security breach detected

**Revocation Process:**

1. **Immediate Action** (Within minutes)
   ```
   - SUPER_ADMIN executes revokeRole()
   - All active sessions terminated
   - Alert sent to all admins
   - Incident logged
   ```

2. **Investigation** (Within 24 hours)
   ```
   - Review recent transactions
   - Assess potential damage
   - Identify compromised data
   - Determine root cause
   ```

3. **Remediation** (Within 48 hours)
   ```
   - If compromise: Issue new credentials
   - If malicious: Legal action if needed
   - If accidental: Retrain and reassign
   - Update security protocols
   ```

4. **Documentation** (Within 1 week)
   ```
   - Complete incident report
   - Document lessons learned
   - Update security policies
   - Train staff on new procedures
   ```

#### Multi-Sig Emergency Revocation
- For SUPER_ADMIN revocation: Requires 2 of 3 SUPER_ADMIN signatures
- For ADMIN revocation: Any SUPER_ADMIN can revoke
- For lower roles: Any ADMIN or SUPER_ADMIN can revoke

---

## Escalation Process

### Level 1: User Issue
**Handler:** ISSUER_ROLE or REVOKER_ROLE  
**Response Time:** 24 hours  
**Examples:**
- Cannot issue certificate
- Interface access issues
- Minor technical problems

### Level 2: Role/Permission Issue
**Handler:** ADMIN_ROLE  
**Response Time:** 12 hours  
**Examples:**
- Role request approval
- Permission conflicts
- Role modifications needed

### Level 3: System Issue
**Handler:** SUPER_ADMIN_ROLE  
**Response Time:** 4 hours  
**Examples:**
- Contract malfunction
- Security incidents
- Critical bugs
- Emergency situations

### Level 4: Critical Emergency
**Handler:** All SUPER_ADMINs + Multi-Sig  
**Response Time:** Immediate  
**Examples:**
- Active security breach
- Contract exploit attempt
- Mass unauthorized access
- System-wide failure

---

## Role Management Best Practices

### 1. Principle of Least Privilege
- Assign minimum role necessary for job function
- Regular review and downgrade unused permissions
- Time-limited roles for temporary staff

### 2. Separation of Duties
- Never combine ISSUER and REVOKER roles for same person
- SUPER_ADMIN should not perform routine operations
- Implement mandatory vacations for role holders

### 3. Audit Trail
- All role changes logged on-chain
- Off-chain documentation maintained
- Regular audit reports generated
- Immutable timestamp records

### 4. Security Measures
- Multi-signature for SUPER_ADMIN operations
- Hardware wallets for high-privilege accounts
- 2FA for all administrative interfaces
- IP whitelisting where applicable
- Rate limiting on role operations

### 5. Training Requirements
- Mandatory security training for all role holders
- Role-specific operational training
- Annual refresher courses
- Incident response drills

### 6. Disaster Recovery
- Backup SUPER_ADMIN keys in secure offline storage
- Documented recovery procedures
- Regular recovery drills
- Multi-geographic key distribution

---

## Role Hierarchy Visualization

```
Access Level: ████████████████████ (100%) SUPER_ADMIN_ROLE
              ████████████████     (80%)  ADMIN_ROLE
              ██████████           (50%)  ISSUER_ROLE
              ██████████           (50%)  REVOKER_ROLE
              ████                 (20%)  VERIFIER_ROLE
              ██                   (10%)  Public (No Role)
```

---

## Compliance and Legal

### Data Protection
- All role holders subject to GDPR/data protection laws
- Regular compliance audits
- Data access logging
- Right to audit provisions

### Liability
- Role holders responsible for their actions
- Indemnification clauses in employment contracts
- Insurance coverage for key role holders
- Legal review of role assignments

### Regulatory Requirements
- Maintain role assignment records for 7 years
- Provide audit trails on request
- Comply with industry-specific regulations
- Regular compliance reporting

---

## Contact Information

**For Role Requests:**
- Email: admin@certificates.example.com
- Support Portal: https://support.certificates.example.com

**For Security Incidents:**
- Emergency Email: security@certificates.example.com
- Phone: +1-XXX-XXX-XXXX (24/7)
- Incident Response Team: incident@certificates.example.com

**For Audit Inquiries:**
- Compliance Team: compliance@certificates.example.com
- Audit Portal: https://audit.certificates.example.com

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | System Architect | Initial RBAC documentation |

---

## Appendix A: Role Permission Matrix

| Function | SUPER_ADMIN | ADMIN | ISSUER | REVOKER | VERIFIER | Public |
|----------|-------------|-------|--------|---------|----------|--------|
| grantRole | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| revokeRole | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| mintCertificate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| revokeCertificate | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| verifyCertificate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pauseContract | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| getCertificateDetails | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| getRoleMembers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| getUserRoles | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

*ADMIN can only manage ISSUER and REVOKER roles, not ADMIN or SUPER_ADMIN

---

## Appendix B: Role Request Form Template

```
CERTIFICATE NFT SYSTEM - ROLE REQUEST FORM

Requestor Information:
- Full Name: ___________________________
- Email: _______________________________
- Department: __________________________
- Employee ID: _________________________
- Wallet Address: ______________________

Role Requested: [ ] ISSUER_ROLE  [ ] REVOKER_ROLE  [ ] ADMIN_ROLE  [ ] VERIFIER_ROLE

Duration: [ ] Permanent  [ ] Temporary (Specify end date: _________)

Justification (minimum 100 words):
___________________________________________
___________________________________________
___________________________________________

Supervisor Approval:
- Supervisor Name: _____________________
- Signature: ___________________________
- Date: ________________________________

For Admin Use Only:
- Request ID: __________________________
- Received Date: _______________________
- Approved By: _________________________
- Role Granted Date: ___________________
- Notes: _______________________________
```
