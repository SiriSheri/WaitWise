import { db, execute, queryOne } from './index.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Starting WaitWise database seeding...');

// Clear existing tables in correct order
db.exec(`
  DELETE FROM wait_time_stats;
  DELETE FROM notifications;
  DELETE FROM queue_entries;
  DELETE FROM counters;
  DELETE FROM services;
  DELETE FROM users;
  DELETE FROM businesses;
`);

const passwordHash = bcrypt.hashSync('password123', 10);
const now = new Date();
const nowIso = now.toISOString();

// Helper to subtract minutes
function minsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

// 1. Seed Businesses
const businesses = [
  {
    id: 'biz_metro_hospital',
    name: 'Metro Care General Hospital',
    category: 'hospital',
    description: 'Premier regional hospital with 24/7 emergency care, specialty outpatient clinics, and express pharmacy.',
    address: '450 Health Parkway, Medical District',
    city: 'Metro City',
    phone: '+1 (555) 345-6789',
    operating_hours: JSON.stringify({
      mon: '00:00 - 23:59',
      tue: '00:00 - 23:59',
      wed: '00:00 - 23:59',
      thu: '00:00 - 23:59',
      fri: '00:00 - 23:59',
      sat: '00:00 - 23:59',
      sun: '00:00 - 23:59',
    }),
    status: 'busy',
    max_capacity: 120,
    avg_service_time_mins: 18,
    image_url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
  {
    id: 'biz_apex_dental',
    name: 'Apex Dental & Orthodontics',
    category: 'clinic',
    description: 'Modern family dental practice offering pain-free cleanings, cosmetic dentistry, and dental emergencies.',
    address: '128 Orchard Boulevard, Suite 300',
    city: 'Metro City',
    phone: '+1 (555) 789-0123',
    operating_hours: JSON.stringify({
      mon: '08:00 - 18:00',
      tue: '08:00 - 18:00',
      wed: '08:00 - 18:00',
      thu: '08:00 - 18:00',
      fri: '08:00 - 17:00',
      sat: '09:00 - 14:00',
      sun: 'Closed',
    }),
    status: 'open',
    max_capacity: 40,
    avg_service_time_mins: 25,
    image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
  {
    id: 'biz_civic_dmv',
    name: 'Civic DMV & Licensing Center',
    category: 'government',
    description: 'Department of Motor Vehicles: driver licensing, vehicle registration, and REAL ID processing center.',
    address: '900 Government Plaza, Floor 1',
    city: 'Metro City',
    phone: '+1 (555) 901-2345',
    operating_hours: JSON.stringify({
      mon: '08:30 - 16:30',
      tue: '08:30 - 16:30',
      wed: '08:30 - 16:30',
      thu: '08:30 - 16:30',
      fri: '08:30 - 16:00',
      sat: 'Closed',
      sun: 'Closed',
    }),
    status: 'almost_full',
    max_capacity: 80,
    avg_service_time_mins: 12,
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
  {
    id: 'biz_radiant_salon',
    name: 'Radiant Glow Salon & Spa',
    category: 'salon',
    description: 'Upscale hair studio, beard grooming, manicures, and revitalizing skin treatments by master stylists.',
    address: '74 Fashion Avenue, Soho District',
    city: 'Metro City',
    phone: '+1 (555) 234-5678',
    operating_hours: JSON.stringify({
      mon: '09:30 - 20:00',
      tue: '09:30 - 20:00',
      wed: '09:30 - 20:00',
      thu: '09:30 - 20:00',
      fri: '09:30 - 21:00',
      sat: '09:00 - 21:00',
      sun: '10:00 - 18:00',
    }),
    status: 'open',
    max_capacity: 30,
    avg_service_time_mins: 30,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
  {
    id: 'biz_urban_tech',
    name: 'Urban Tech Care Hub',
    category: 'service_center',
    description: 'Certified hardware diagnostics, screen and battery repairs, data recovery, and walk-in tech support.',
    address: '220 Silicon Way, Tech Park',
    city: 'Metro City',
    phone: '+1 (555) 456-7890',
    operating_hours: JSON.stringify({
      mon: '10:00 - 19:00',
      tue: '10:00 - 19:00',
      wed: '10:00 - 19:00',
      thu: '10:00 - 19:00',
      fri: '10:00 - 19:00',
      sat: '10:00 - 18:00',
      sun: '11:00 - 16:00',
    }),
    status: 'open',
    max_capacity: 35,
    avg_service_time_mins: 15,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
  {
    id: 'biz_olive_bistro',
    name: 'The Olive Grove Artisanal Bistro',
    category: 'restaurant',
    description: 'Rustic Mediterranean dining featuring wood-fired fare, handcrafted pastas, and fine organic wines.',
    address: '512 Culinary Row',
    city: 'Metro City',
    phone: '+1 (555) 678-9012',
    operating_hours: JSON.stringify({
      mon: '11:30 - 22:30',
      tue: '11:30 - 22:30',
      wed: '11:30 - 22:30',
      thu: '11:30 - 22:30',
      fri: '11:30 - 23:30',
      sat: '11:00 - 23:30',
      sun: '11:00 - 21:30',
    }),
    status: 'busy',
    max_capacity: 60,
    avg_service_time_mins: 40,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    created_at: nowIso,
  },
];

for (const b of businesses) {
  execute(
    `INSERT INTO businesses (id, name, category, description, address, city, phone, operating_hours, status, max_capacity, avg_service_time_mins, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.id, b.name, b.category, b.description, b.address, b.city, b.phone, b.operating_hours, b.status, b.max_capacity, b.avg_service_time_mins, b.image_url, b.created_at]
  );
}

// 2. Seed Users
const users = [
  {
    id: 'usr_admin',
    name: 'System Admin',
    email: 'admin@waitwise.com',
    password_hash: passwordHash,
    role: 'admin',
    status: 'approved',
    job_title: 'Platform Superadmin',
    employee_id: 'ADM-001',
    phone: '+1 (555) 000-0001',
    business_id: null,
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_hospital',
    name: 'Nurse Sarah Jenkins',
    email: 'metro.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'approved',
    job_title: 'Triage & Outpatient Lead',
    employee_id: 'EMP-HOSP-104',
    phone: '+1 (555) 000-0002',
    business_id: 'biz_metro_hospital',
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_dmv',
    name: 'Officer Marcus Vance',
    email: 'dmv.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'approved',
    job_title: 'Senior Licensing Officer',
    employee_id: 'EMP-DMV-201',
    phone: '+1 (555) 000-0003',
    business_id: 'biz_civic_dmv',
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_salon',
    name: 'Elena Rostova',
    email: 'salon.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'approved',
    job_title: 'Master Stylist & Salon Director',
    employee_id: 'EMP-SALON-05',
    phone: '+1 (555) 000-0004',
    business_id: 'biz_radiant_salon',
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_dental',
    name: 'Dr. David Chen',
    email: 'apex.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'approved',
    job_title: 'Clinical Dental Director',
    employee_id: 'EMP-DENT-12',
    phone: '+1 (555) 000-0005',
    business_id: 'biz_apex_dental',
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_tech',
    name: 'Alex Rivera',
    email: 'tech.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'approved',
    job_title: 'Lead Diagnostic Specialist',
    employee_id: 'EMP-TECH-88',
    phone: '+1 (555) 000-0006',
    business_id: 'biz_urban_tech',
    verified_at: nowIso,
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: nowIso,
  },
  {
    id: 'usr_staff_pending',
    name: 'Dr. Jonathan Hayes',
    email: 'pending.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'pending',
    job_title: 'Attending Pediatrician',
    employee_id: 'EMP-HOSP-990',
    phone: '+1 (555) 000-0007',
    business_id: 'biz_metro_hospital',
    verified_at: null,
    verified_by: null,
    rejection_reason: null,
    created_at: minsAgo(120),
  },
  {
    id: 'usr_staff_rejected',
    name: 'Fake Applicant',
    email: 'rejected.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'rejected',
    job_title: 'Unverified Intern',
    employee_id: 'EMP-FAKE-001',
    phone: '+1 (555) 000-0008',
    business_id: 'biz_civic_dmv',
    verified_at: minsAgo(60),
    verified_by: 'usr_admin',
    rejection_reason: 'Invalid organization employee ID and badge verification failed.',
    created_at: minsAgo(300),
  },
  {
    id: 'usr_staff_suspended',
    name: 'Inactive Contractor',
    email: 'suspended.staff@waitwise.com',
    password_hash: passwordHash,
    role: 'staff',
    status: 'suspended',
    job_title: 'Styling Contractor',
    employee_id: 'EMP-SALON-99',
    phone: '+1 (555) 000-0009',
    business_id: 'biz_radiant_salon',
    verified_at: minsAgo(1000),
    verified_by: 'usr_admin',
    rejection_reason: null,
    created_at: minsAgo(2000),
  },
  {
    id: 'usr_customer_demo',
    name: 'Alex Morgan',
    email: 'user@waitwise.com',
    password_hash: passwordHash,
    role: 'customer',
    status: 'approved',
    job_title: null,
    employee_id: null,
    phone: '+1 (555) 999-1234',
    business_id: null,
    verified_at: nowIso,
    verified_by: null,
    rejection_reason: null,
    created_at: nowIso,
  },
];

for (const u of users) {
  execute(
    `INSERT INTO users (id, name, email, password_hash, role, status, job_title, employee_id, phone, business_id, verified_at, verified_by, rejection_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [u.id, u.name, u.email, u.password_hash, u.role, u.status, u.job_title, u.employee_id, u.phone, u.business_id, u.verified_at, u.verified_by, u.rejection_reason, u.created_at]
  );
}

// 3. Seed Services
const services = [
  // Metro Hospital
  { id: 'srv_hosp_triage', business_id: 'biz_metro_hospital', name: 'General Outpatient & Triage', description: 'Initial medical assessment and physician consult', default_duration_mins: 15, price: 0 },
  { id: 'srv_hosp_blood', business_id: 'biz_metro_hospital', name: 'Diagnostic Blood & Lab Work', description: 'Routine lab tests, CBC, lipid panel, and blood draws', default_duration_mins: 8, price: 25 },
  { id: 'srv_hosp_pharma', business_id: 'biz_metro_hospital', name: 'Express Prescription Dispensing', description: 'Pharmacy pickup, dosage consultation, and refills', default_duration_mins: 6, price: 0 },
  
  // Apex Dental
  { id: 'srv_dent_clean', business_id: 'biz_apex_dental', name: 'Comprehensive Dental Cleaning', description: 'Ultrasonic scaling, polish, and oral cancer screening', default_duration_mins: 30, price: 95 },
  { id: 'srv_dent_consult', business_id: 'biz_apex_dental', name: 'Orthodontic & Aligners Consultation', description: '3D scan and personalized teeth alignment planning', default_duration_mins: 20, price: 50 },
  { id: 'srv_dent_emergency', business_id: 'biz_apex_dental', name: 'Emergency Toothache & Pain Relief', description: 'Urgent assessment for tooth pain, cracks, or trauma', default_duration_mins: 25, price: 120 },

  // Civic DMV
  { id: 'srv_dmv_license', business_id: 'biz_civic_dmv', name: 'Driver License Renewal & Upgrade', description: 'Standard renewals, address update, photo capture', default_duration_mins: 12, price: 35 },
  { id: 'srv_dmv_realid', business_id: 'biz_civic_dmv', name: 'REAL ID Application & Verification', description: 'Document verification and federal ID compliance issuance', default_duration_mins: 18, price: 45 },
  { id: 'srv_dmv_vehicle', business_id: 'biz_civic_dmv', name: 'Vehicle Title & Registration', description: 'Plates transfer, registration tabs, and title change', default_duration_mins: 10, price: 20 },

  // Radiant Salon
  { id: 'srv_sal_cut', business_id: 'biz_radiant_salon', name: 'Designer Haircut & Blowout', description: 'Consultation, scalp massage, tailored cut and blowout', default_duration_mins: 35, price: 65 },
  { id: 'srv_sal_beard', business_id: 'biz_radiant_salon', name: 'Gentlemen Beard Sculpt & Hot Towel', description: 'Precision razor line-up, beard oil treatment, hot towel', default_duration_mins: 20, price: 35 },
  { id: 'srv_sal_facial', business_id: 'biz_radiant_salon', name: 'Hydro-Glow Express Facial', description: 'Deep pore cleansing, hyaluronic hydration, LED light therapy', default_duration_mins: 40, price: 85 },

  // Urban Tech Care
  { id: 'srv_tech_diag', business_id: 'biz_urban_tech', name: 'Walk-In Diagnostics & Checkup', description: 'Hardware evaluation and software troubleshooting', default_duration_mins: 15, price: 29 },
  { id: 'srv_tech_screen', business_id: 'biz_urban_tech', name: 'Same-Day Screen Replacement', description: 'OEM glass display replacement and calibration', default_duration_mins: 45, price: 129 },

  // Olive Bistro
  { id: 'srv_rest_table2', business_id: 'biz_olive_bistro', name: 'Table for 2 Guests', description: 'Indoor dining or patio table for couples/parties of 2', default_duration_mins: 30, price: 0 },
  { id: 'srv_rest_table4', business_id: 'biz_olive_bistro', name: 'Table for 3 to 5 Guests', description: 'Family booth or main dining table', default_duration_mins: 45, price: 0 },
];

for (const s of services) {
  execute(
    `INSERT INTO services (id, business_id, name, description, default_duration_mins, price, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [s.id, s.business_id, s.name, s.description, s.default_duration_mins, s.price]
  );
}

// 4. Seed Counters
const counters = [
  // Metro Hospital Counters
  { id: 'cnt_hosp_1', business_id: 'biz_metro_hospital', name: 'Triage Room 1 - Nurse Jenkins', staff_id: 'usr_staff_hospital', is_active: 1, current_ticket_id: 'tkt_hosp_serving' },
  { id: 'cnt_hosp_2', business_id: 'biz_metro_hospital', name: 'Triage Room 2 - Dr. Roberts', staff_id: null, is_active: 1, current_ticket_id: null },
  { id: 'cnt_hosp_3', business_id: 'biz_metro_hospital', name: 'Lab Draw Station A', staff_id: null, is_active: 1, current_ticket_id: null },
  
  // Civic DMV Counters
  { id: 'cnt_dmv_1', business_id: 'biz_civic_dmv', name: 'Window 1 (Licenses) - Officer Vance', staff_id: 'usr_staff_dmv', is_active: 1, current_ticket_id: 'tkt_dmv_serving' },
  { id: 'cnt_dmv_2', business_id: 'biz_civic_dmv', name: 'Window 2 (REAL ID)', staff_id: null, is_active: 1, current_ticket_id: null },
  { id: 'cnt_dmv_3', business_id: 'biz_civic_dmv', name: 'Window 3 (Vehicles)', staff_id: null, is_active: 1, current_ticket_id: null },

  // Radiant Salon Chairs
  { id: 'cnt_sal_1', business_id: 'biz_radiant_salon', name: 'Chair 1 - Elena Rostova', staff_id: 'usr_staff_salon', is_active: 1, current_ticket_id: 'tkt_sal_serving' },
  { id: 'cnt_sal_2', business_id: 'biz_radiant_salon', name: 'Chair 2 - Master Barber Jack', staff_id: null, is_active: 1, current_ticket_id: null },

  // Apex Dental
  { id: 'cnt_dent_1', business_id: 'biz_apex_dental', name: 'Operatory 1 - Dr. Chen', staff_id: 'usr_staff_dental', is_active: 1, current_ticket_id: null },
  { id: 'cnt_dent_2', business_id: 'biz_apex_dental', name: 'Hygienist Suite B', staff_id: null, is_active: 1, current_ticket_id: null },
];

for (const c of counters) {
  execute(
    `INSERT INTO counters (id, business_id, name, staff_id, is_active, current_ticket_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.id, c.business_id, c.name, c.staff_id, c.is_active, c.current_ticket_id]
  );
}

// 5. Seed Queue Entries (Active, Serving, Waiting, and Past Completed)
const queueEntries = [
  // Metro Hospital - Currently Serving
  {
    id: 'tkt_hosp_serving',
    ticket_number: 'MGH-101',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_triage',
    user_id: null,
    counter_id: 'cnt_hosp_1',
    customer_name: 'Daniel Carter',
    customer_phone: '+1 555-443-2211',
    status: 'serving',
    priority: 0,
    notes: 'Walk-in triage visit, minor sprain',
    estimated_wait_mins: 0,
    actual_wait_mins: 14,
    joined_at: minsAgo(22),
    called_at: minsAgo(8),
    served_at: minsAgo(8),
    completed_at: null,
  },
  // Metro Hospital - User Demo's Active Ticket!
  {
    id: 'tkt_demo_active',
    ticket_number: 'MGH-102',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_triage',
    user_id: 'usr_customer_demo',
    counter_id: null,
    customer_name: 'Alex Morgan',
    customer_phone: '+1 555-999-1234',
    status: 'waiting',
    priority: 0,
    notes: 'Flu-like symptoms & mild fever',
    estimated_wait_mins: 12,
    actual_wait_mins: null,
    joined_at: minsAgo(15),
    called_at: null,
    served_at: null,
    completed_at: null,
  },
  {
    id: 'tkt_hosp_wait_2',
    ticket_number: 'MGH-103',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_blood',
    user_id: null,
    counter_id: null,
    customer_name: 'Priya Sharma',
    customer_phone: '+1 555-882-9900',
    status: 'waiting',
    priority: 0,
    notes: 'Fasting blood panel draw',
    estimated_wait_mins: 22,
    actual_wait_mins: null,
    joined_at: minsAgo(10),
    called_at: null,
    served_at: null,
    completed_at: null,
  },
  {
    id: 'tkt_hosp_wait_3',
    ticket_number: 'MGH-104',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_triage',
    user_id: null,
    counter_id: null,
    customer_name: 'James O’Connor',
    customer_phone: '+1 555-776-5544',
    status: 'waiting',
    priority: 1, // Priority Flag
    notes: 'Elderly patient with chest tightness',
    estimated_wait_mins: 32,
    actual_wait_mins: null,
    joined_at: minsAgo(5),
    called_at: null,
    served_at: null,
    completed_at: null,
  },

  // Civic DMV Queue
  {
    id: 'tkt_dmv_serving',
    ticket_number: 'DMV-045',
    business_id: 'biz_civic_dmv',
    service_id: 'srv_dmv_license',
    user_id: null,
    counter_id: 'cnt_dmv_1',
    customer_name: 'Sophia Rodriguez',
    customer_phone: '+1 555-123-9988',
    status: 'serving',
    priority: 0,
    notes: 'Out of state license transfer',
    estimated_wait_mins: 0,
    actual_wait_mins: 25,
    joined_at: minsAgo(30),
    called_at: minsAgo(5),
    served_at: minsAgo(5),
    completed_at: null,
  },
  {
    id: 'tkt_dmv_wait_1',
    ticket_number: 'DMV-046',
    business_id: 'biz_civic_dmv',
    service_id: 'srv_dmv_realid',
    user_id: null,
    counter_id: null,
    customer_name: 'Liam Zhang',
    customer_phone: '+1 555-334-7711',
    status: 'waiting',
    priority: 0,
    notes: 'First time REAL ID upgrade',
    estimated_wait_mins: 14,
    actual_wait_mins: null,
    joined_at: minsAgo(18),
    called_at: null,
    served_at: null,
    completed_at: null,
  },
  {
    id: 'tkt_dmv_wait_2',
    ticket_number: 'DMV-047',
    business_id: 'biz_civic_dmv',
    service_id: 'srv_dmv_vehicle',
    user_id: null,
    counter_id: null,
    customer_name: 'Emma Watson',
    customer_phone: '+1 555-667-2299',
    status: 'waiting',
    priority: 0,
    notes: 'Commercial plate renewal',
    estimated_wait_mins: 24,
    actual_wait_mins: null,
    joined_at: minsAgo(12),
    called_at: null,
    served_at: null,
    completed_at: null,
  },

  // Radiant Salon Queue
  {
    id: 'tkt_sal_serving',
    ticket_number: 'SAL-012',
    business_id: 'biz_radiant_salon',
    service_id: 'srv_sal_cut',
    user_id: null,
    counter_id: 'cnt_sal_1',
    customer_name: 'Chloe Bennett',
    customer_phone: '+1 555-908-1122',
    status: 'serving',
    priority: 0,
    notes: 'Layered bob with styling',
    estimated_wait_mins: 0,
    actual_wait_mins: 15,
    joined_at: minsAgo(35),
    called_at: minsAgo(20),
    served_at: minsAgo(20),
    completed_at: null,
  },
  {
    id: 'tkt_sal_wait_1',
    ticket_number: 'SAL-013',
    business_id: 'biz_radiant_salon',
    service_id: 'srv_sal_beard',
    user_id: null,
    counter_id: null,
    customer_name: 'Michael Scott',
    customer_phone: '+1 555-312-9944',
    status: 'waiting',
    priority: 0,
    notes: 'Beard trim + hot towel massage',
    estimated_wait_mins: 15,
    actual_wait_mins: null,
    joined_at: minsAgo(14),
    called_at: null,
    served_at: null,
    completed_at: null,
  },

  // Completed Tickets (For historical stats)
  {
    id: 'tkt_comp_1',
    ticket_number: 'MGH-099',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_triage',
    user_id: 'usr_customer_demo',
    counter_id: 'cnt_hosp_1',
    customer_name: 'Alex Morgan',
    customer_phone: '+1 555-999-1234',
    status: 'completed',
    priority: 0,
    notes: 'Follow-up checkup',
    estimated_wait_mins: 15,
    actual_wait_mins: 16,
    joined_at: minsAgo(120),
    called_at: minsAgo(104),
    served_at: minsAgo(104),
    completed_at: minsAgo(88),
  },
  {
    id: 'tkt_comp_2',
    ticket_number: 'MGH-100',
    business_id: 'biz_metro_hospital',
    service_id: 'srv_hosp_blood',
    user_id: null,
    counter_id: 'cnt_hosp_3',
    customer_name: 'Ethan Hunt',
    customer_phone: '+1 555-888-0000',
    status: 'completed',
    priority: 0,
    notes: 'Routine blood test',
    estimated_wait_mins: 8,
    actual_wait_mins: 7,
    joined_at: minsAgo(95),
    called_at: minsAgo(88),
    served_at: minsAgo(88),
    completed_at: minsAgo(80),
  },
];

for (const q of queueEntries) {
  execute(
    `INSERT INTO queue_entries (id, ticket_number, business_id, service_id, user_id, counter_id, customer_name, customer_phone, status, priority, notes, estimated_wait_mins, actual_wait_mins, joined_at, called_at, served_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.id, q.ticket_number, q.business_id, q.service_id, q.user_id, q.counter_id, q.customer_name, q.customer_phone, q.status, q.priority, q.notes, q.estimated_wait_mins, q.actual_wait_mins, q.joined_at, q.called_at, q.served_at, q.completed_at]
  );
}

// 6. Seed Notifications for Demo User
const notifications = [
  {
    id: 'notif_1',
    user_id: 'usr_customer_demo',
    ticket_id: 'tkt_demo_active',
    type: 'turn_approaching',
    title: 'Almost Your Turn at Metro Care Hospital!',
    message: 'Ticket MGH-102: You are 1 spot away. Please head toward Triage Waiting Area B.',
    is_read: 0,
    created_at: minsAgo(2),
  },
  {
    id: 'notif_2',
    user_id: 'usr_customer_demo',
    ticket_id: 'tkt_comp_1',
    type: 'info',
    title: 'Queue Visit Completed',
    message: 'Thank you for visiting Metro Care Hospital. Your total wait was 16 minutes.',
    is_read: 1,
    created_at: minsAgo(85),
  },
];

for (const n of notifications) {
  execute(
    `INSERT INTO notifications (id, user_id, ticket_id, type, title, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [n.id, n.user_id, n.ticket_id, n.type, n.title, n.message, n.is_read, n.created_at]
  );
}

// 7. Seed Wait Time Stats across hours (8 AM to 8 PM) for smart charts and off-peak insights
const hourlyDistribution = [
  { hour: 8, wait: 8, service: 14, count: 18 },
  { hour: 9, wait: 18, service: 16, count: 32 },
  { hour: 10, wait: 28, service: 18, count: 48 }, // Peak
  { hour: 11, wait: 35, service: 19, count: 54 }, // Peak
  { hour: 12, wait: 24, service: 16, count: 38 },
  { hour: 13, wait: 14, service: 15, count: 22 }, // Off-peak lunch dip
  { hour: 14, wait: 19, service: 16, count: 30 },
  { hour: 15, wait: 31, service: 18, count: 46 }, // Afternoon rush
  { hour: 16, wait: 36, service: 19, count: 52 }, // Afternoon peak
  { hour: 17, wait: 22, service: 17, count: 34 },
  { hour: 18, wait: 15, service: 15, count: 24 },
  { hour: 19, wait: 10, service: 14, count: 16 },
  { hour: 20, wait: 6, service: 12, count: 10 },
];

let statIdCounter = 1;
for (const b of businesses) {
  for (let day = 1; day <= 6; day++) {
    for (const h of hourlyDistribution) {
      // Add slight variance per business
      const waitMultiplier = b.category === 'hospital' ? 1.2 : b.category === 'government' ? 1.4 : b.category === 'salon' ? 0.9 : 1.0;
      execute(
        `INSERT INTO wait_time_stats (id, business_id, service_id, day_of_week, hour_of_day, avg_wait_mins, avg_service_mins, sample_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `stat_${statIdCounter++}`,
          b.id,
          null,
          day,
          h.hour,
          Math.round(h.wait * waitMultiplier),
          Math.round(h.service * waitMultiplier),
          h.count,
        ]
      );
    }
  }
}

console.log('✅ WaitWise database seeded successfully!');
console.log('📊 Summary:');
console.log(`- ${businesses.length} Businesses seeded`);
console.log(`- ${users.length} Users & Staff accounts seeded`);
console.log(`- ${services.length} Services seeded`);
console.log(`- ${counters.length} Active Counters seeded`);
console.log(`- ${queueEntries.length} Queue entries seeded (Live & Completed)`);
console.log(`- ${notifications.length} User Notifications seeded`);
console.log(`- ${statIdCounter - 1} Hourly wait stats records seeded for Smart Engine`);
