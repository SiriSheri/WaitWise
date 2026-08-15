import { DatabaseSync } from 'node:sqlite';

const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   WAITWISE FULL-STACK SECURITY & RBAC TEST SUITE   ');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failedCount++;
    }
  }

  // ----------------------------------------------------
  // Test 1: Customer Registration & Token Issuance
  // ----------------------------------------------------
  const customerEmail = `customer_${Date.now()}@example.com`;
  const regCustRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Customer',
      email: customerEmail,
      password: 'password123',
      phone: '+15551112222',
    }),
  });
  const regCustData: any = await regCustRes.json();
  assert(regCustRes.status === 201 && !!regCustData.token, '1. Customer registration returns 201 & valid JWT');
  const customerToken = regCustData.token;

  // ----------------------------------------------------
  // Test 2: Duplicate Registration Prevention
  // ----------------------------------------------------
  const dupCustRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Customer',
      email: customerEmail,
      password: 'password123',
    }),
  });
  assert(dupCustRes.status === 409, '2. Duplicate email registration returns 409 Conflict');

  // ----------------------------------------------------
  // Test 3: Customer Cannot Access Staff Walk-In API
  // ----------------------------------------------------
  const custWalkInRes = await fetch(`${API_BASE}/staff/walk-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      businessId: 'biz_metro_hospital',
      serviceId: 'srv_hosp_triage',
      customerName: 'Hacker Customer',
    }),
  });
  assert(custWalkInRes.status === 403, '3. Customer calling Staff Walk-In API returns 403 Forbidden');

  // ----------------------------------------------------
  // Test 4: Staff Registration (Starts as PENDING)
  // ----------------------------------------------------
  const staffApplicantEmail = `staff_applicant_${Date.now()}@hospital.org`;
  const staffRegRes = await fetch(`${API_BASE}/auth/staff-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Emily Watson',
      email: staffApplicantEmail,
      password: 'password123',
      phone: '+15558889999',
      business_id: 'biz_metro_hospital',
      job_title: 'Emergency Medicine Attending',
      employee_id: 'EMP-HOSP-771',
    }),
  });
  const staffRegData: any = await staffRegRes.json();
  assert(
    staffRegRes.status === 201 && staffRegData.status === 'pending',
    '4. Staff registration creates account in PENDING status (No immediate token)'
  );
  const newStaffUserId = staffRegData.user.id;

  // ----------------------------------------------------
  // Test 5: Pending Staff Login is Blocked with 403
  // ----------------------------------------------------
  const pendingLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffApplicantEmail,
      password: 'password123',
    }),
  });
  const pendingLoginData: any = await pendingLoginRes.json();
  assert(
    pendingLoginRes.status === 403 && pendingLoginData.status === 'pending',
    '5. Pending staff login returns 403 with pending status message'
  );

  // ----------------------------------------------------
  // Test 6: Admin Login & Verification Center
  // ----------------------------------------------------
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@waitwise.com',
      password: 'password123',
    }),
  });
  const adminLoginData: any = await adminLoginRes.json();
  assert(
    adminLoginRes.status === 200 && adminLoginData.user?.role === 'admin',
    '6. Superadmin logs in and receives admin JWT'
  );
  const adminToken = adminLoginData.token;

  // ----------------------------------------------------
  // Test 7: Admin Lists Verification Requests
  // ----------------------------------------------------
  const verificationsRes = await fetch(`${API_BASE}/admin/verifications?status=pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const verificationsData: any = await verificationsRes.json();
  const foundApplicant = verificationsData.staff?.find((s: any) => s.id === newStaffUserId);
  assert(
    verificationsRes.status === 200 && !!foundApplicant,
    '7. Admin retrieves pending verification list and finds new applicant'
  );

  // ----------------------------------------------------
  // Test 8: Admin Approves Staff Account
  // ----------------------------------------------------
  const approveRes = await fetch(`${API_BASE}/admin/verifications/${newStaffUserId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const approveData: any = await approveRes.json();
  assert(
    approveRes.status === 200 && approveData.user?.status === 'approved',
    '8. Admin approves staff account (Status updated to APPROVED)'
  );

  // ----------------------------------------------------
  // Test 9: Approved Staff Can Now Log In
  // ----------------------------------------------------
  const approvedLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffApplicantEmail,
      password: 'password123',
    }),
  });
  const approvedLoginData: any = await approvedLoginRes.json();
  assert(
    approvedLoginRes.status === 200 && approvedLoginData.user?.role === 'staff' && approvedLoginData.user?.status === 'approved',
    '9. Approved staff logs in successfully and receives staff token'
  );
  const staffToken = approvedLoginData.token;

  // ----------------------------------------------------
  // Test 10: Approved Staff Issues Walk-In for Assigned Hospital
  // ----------------------------------------------------
  const staffWalkInRes = await fetch(`${API_BASE}/staff/walk-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      businessId: 'biz_metro_hospital',
      serviceId: 'srv_hosp_triage',
      customerName: 'Jane Doe (Urgent Walk-in)',
      priority: 1,
    }),
  });
  const staffWalkInData: any = await staffWalkInRes.json();
  assert(
    staffWalkInRes.status === 201 && !!staffWalkInData.ticket,
    '10. Approved staff creates walk-in ticket for assigned facility (201 Created)'
  );

  // ----------------------------------------------------
  // Test 11: Multi-Tenant Isolation (Staff cannot manage other businesses)
  // ----------------------------------------------------
  const unauthorizedBizWalkInRes = await fetch(`${API_BASE}/staff/walk-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      businessId: 'biz_civic_dmv', // Hospital staff trying to issue ticket at DMV
      serviceId: 'srv_dmv_lic_renew',
      customerName: 'Cross Tenant Intruder',
    }),
  });
  assert(
    unauthorizedBizWalkInRes.status === 403,
    '11. Multi-Tenant Isolation: Staff member blocked from managing other organizations (403 Forbidden)'
  );

  // ----------------------------------------------------
  // Test 12: Admin Suspends Staff Account
  // ----------------------------------------------------
  const suspendRes = await fetch(`${API_BASE}/admin/verifications/${newStaffUserId}/suspend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(suspendRes.status === 200, '12. Admin suspends staff account');

  // ----------------------------------------------------
  // Test 13: Suspended Staff is Denied Access
  // ----------------------------------------------------
  const suspendedActionRes = await fetch(`${API_BASE}/staff/walk-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      businessId: 'biz_metro_hospital',
      serviceId: 'srv_hosp_triage',
      customerName: 'Suspended Ticket Attempt',
    }),
  });
  assert(
    suspendedActionRes.status === 403,
    '13. Suspended staff token immediately denied access to staff endpoints (403 Forbidden)'
  );

  // ----------------------------------------------------
  // Test 14: Customer Joins Virtual Queue Correctly
  // ----------------------------------------------------
  const custJoinRes = await fetch(`${API_BASE}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      businessId: 'biz_metro_hospital',
      serviceId: 'srv_hosp_triage',
      customerName: 'Registered Customer Join',
    }),
  });
  assert(custJoinRes.status === 201, '14. Customer joins virtual queue and receives digital ticket (201 Created)');

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED   `);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
