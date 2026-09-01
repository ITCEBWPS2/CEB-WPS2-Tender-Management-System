require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Bidder = require('./models/Bidder');
const Department = require('./models/Department');
const Staff = require('./models/Staff');
const Committee = require('./models/Committee');
const Record = require('./models/Record');

const supabase = require('./config/supabase');

async function populateSeedData() {
  console.log('Seeding CEB Tender Management System data...');
  try {
    // 1. Seed demo accounts in Supabase users table
    const demoAccounts = [
      { name: 'Demo Admin', email: 'abc@gmail.com', epfNumber: 'EPF001', password: 'ABC@123', role: 'Admin' },
      { name: 'Demo Procurement Officer', email: 'procurement@ceb-tms.local', epfNumber: 'EPF002', password: 'Procurement@123', role: 'Procurement' },
      { name: 'Demo CECOM Officer', email: 'cecom@ceb-tms.local', epfNumber: 'EPF003', password: 'Cecom@123', role: 'CECOM' },
      { name: 'Demo Clerk', email: 'clerk@ceb-tms.local', epfNumber: 'EPF004', password: 'Clerk@123', role: 'Clerk' }
    ];

    const bcrypt = require('bcryptjs');
    for (const acc of demoAccounts) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', acc.email)
        .maybeSingle();

      const hash = bcrypt.hashSync(acc.password, 10);

      if (!existingUser) {
        await supabase.from('users').insert([{
          name: acc.name,
          email: acc.email,
          epf_number: acc.epfNumber,
          password: hash,
          role: acc.role,
          status: 'Active'
        }]);
        console.log(`Created demo user: ${acc.email} (${acc.role})`);
      } else {
        // Ensure password hash is up to date
        await supabase.from('users').update({
          password: hash,
          name: acc.name,
          epf_number: acc.epfNumber,
          role: acc.role,
          status: 'Active'
        }).eq('id', existingUser.id);
        console.log(`Updated/preserved demo user: ${acc.email} (${acc.role})`);
      }

      // Also sync to Mongoose User model if connected as fallback
      try {
        if (mongoose.connection.readyState === 1) {
          let mUser = await User.findOne({ email: acc.email });
          if (!mUser) {
            await User.create({ name: acc.name, email: acc.email, epfNumber: acc.epfNumber, password: hash, role: acc.role });
          } else {
            await User.updateOne({ email: acc.email }, { $set: { password: hash, role: acc.role } });
          }
        }
      } catch (mErr) {}
    }

    await Category.deleteMany();
    await Department.deleteMany();
    await Staff.deleteMany();
    await Bidder.deleteMany();
    await Committee.deleteMany();
    await Record.deleteMany();

    // 2. CATEGORIES (8)
    const categories = await Category.create([
      { name: 'IT Equipment & Software', description: 'Enterprise hardware, networking, datacenter infrastructure, and software licenses' },
      { name: 'Transformers & Switchgear', description: 'High/medium voltage power transformers, outdoor circuit breakers, and sub-station switchgear' },
      { name: 'Civil Works & Construction', description: 'Substation building construction, transmission tower foundations, and cable trenching' },
      { name: 'Vehicles & Transport', description: 'Utility pickup trucks, aerial bucket trucks, heavy crane vehicles, and maintenance fleet' },
      { name: 'Office Supplies & Stationery', description: 'Administrative office equipment, printing consumables, stationery, and office furniture' },
      { name: 'Cables & Conductors', description: 'High-voltage underground XLPE cables, overhead ACSR conductors, and aerial bundled cables' },
      { name: 'Generators & Power Equipment', description: 'Industrial diesel generator sets, power factor correction capacitors, and UPS power systems' },
      { name: 'Consultancy Services', description: 'Feasibility assessments, environmental impact studies, grid integration, and engineering audits' }
    ]);
    console.log(`Created ${categories.length} categories`);

    // 3. DEPARTMENTS / UNITS (6)
    const departments = await Department.create([
      { name: 'Central Engineering Procurement', code: 'CECOM', description: 'Centralized bulk procurement for major CEB national grid projects', headOfDepartment: 'Eng. W.A. Perera', status: 'Active' },
      { name: 'Transmission Division', code: 'TRN', description: 'High-voltage grid transmission network development and maintenance', headOfDepartment: 'Eng. K.L. Jayasinghe', status: 'Active' },
      { name: 'Distribution Division', code: 'DIS', description: 'Regional electricity distribution, metering, and consumer connections', headOfDepartment: 'Eng. M.D. Silva', status: 'Active' },
      { name: 'Generation Division', code: 'GEN', description: 'Thermal, hydro, and renewable energy power plant operations and maintenance', headOfDepartment: 'Eng. S.B. Fernando', status: 'Active' },
      { name: 'IT Division', code: 'ITD', description: 'Enterprise software systems, data centers, and telecommunications infrastructure', headOfDepartment: 'Eng. N.P. Rajapaksha', status: 'Active' },
      { name: 'Finance Division', code: 'FIN', description: 'Financial management, budget control, payroll, and tender disbursements', headOfDepartment: 'Mr. T.K. Gunawardena', status: 'Active' }
    ]);
    console.log(`Created ${departments.length} departments/units`);

    // 4. STAFF (10)
    const staffMembers = await Staff.create([
      { name: 'Eng. W.A. Perera', email: 'perera.wa@ceb.lk', area: 'CECOM', designation: 'Chief Engineer', department: departments[0]._id },
      { name: 'Eng. K.L. Jayasinghe', email: 'jayasinghe.kl@ceb.lk', area: 'Transmission', designation: 'Deputy General Manager', department: departments[1]._id },
      { name: 'Eng. Chaminda Rathnayake', email: 'rathnayake.c@ceb.lk', area: 'Distribution', designation: 'Executive Engineer', department: departments[2]._id },
      { name: 'Eng. Dilani Wickramasinghe', email: 'wickramasinghe.d@ceb.lk', area: 'Generation', designation: 'Senior Electrical Engineer', department: departments[3]._id },
      { name: 'Eng. Kasun Bandara', email: 'bandara.k@ceb.lk', area: 'IT Division', designation: 'Assistant Engineer', department: departments[4]._id },
      { name: 'Mrs. Sunethra De Silva', email: 'desilva.s@ceb.lk', area: 'Finance', designation: 'Chief Accountant', department: departments[5]._id },
      { name: 'Eng. Ruwan Mendis', email: 'mendis.r@ceb.lk', area: 'CECOM', designation: 'Procurement Officer', department: departments[0]._id },
      { name: 'Eng. Nadeeka Herath', email: 'herath.n@ceb.lk', area: 'Transmission', designation: 'Technical Evaluation Officer', department: departments[1]._id },
      { name: 'Eng. Asanka Priyadarshana', email: 'priyadarshana.a@ceb.lk', area: 'Generation', designation: 'Superintending Engineer', department: departments[3]._id },
      { name: 'Eng. Mahesh Liyanage', email: 'liyanage.m@ceb.lk', area: 'IT Division', designation: 'Systems Administrator', department: departments[4]._id }
    ]);
    console.log(`Created ${staffMembers.length} staff members`);

    // 5. BIDDERS / SUPPLIERS (12)
    const bidders = await Bidder.create([
      { name: 'Sierra Cables PLC', email: 'info@sierracables.lk', contact: '0112445566', address: 'No. 112, Havelock Road, Colombo 05' },
      { name: 'ACL Cables PLC', email: 'sales@aclcables.com', contact: '0117608300', address: 'No. 60, Sri Chittampalam A. Gardiner Mawatha, Colombo 02' },
      { name: 'Metropolitan Technologies (Pvt) Ltd', email: 'contact@metropolitan.lk', contact: '0112437878', address: 'No. 85, Braybrooke Place, Colombo 02' },
      { name: 'LTL Holdings (Pvt) Ltd', email: 'info@ltl.lk', contact: '0112695237', address: 'No. 67, Park Street, Colombo 02' },
      { name: 'DIMO PLC', email: 'dimo@dimolanka.com', contact: '0112449797', address: 'No. 65, Jetawana Road, Colombo 14' },
      { name: 'Access Engineering PLC', email: 'direct@accesseng.sl', contact: '0117606600', address: 'Access Tower, No. 278, Union Place, Colombo 02' },
      { name: 'VS Hydro (Pvt) Ltd', email: 'projects@vshydro.com', contact: '0114721900', address: 'No. 34, Ward Place, Colombo 07' },
      { name: 'Sanken Construction (Pvt) Ltd', email: 'info@sanken.lk', contact: '0112874300', address: 'No. 295, Madinnagoda Road, Rajagiriya' },
      { name: 'DMS Electronics (Pvt) Ltd', email: 'info@dmselectronics.com', contact: '0112691697', address: 'No. 2, School Lane, Colombo 03' },
      { name: 'Kelani Cables PLC', email: 'kelani@kelanicables.com', contact: '0112520840', address: 'P.O. Box 14, Wewelduwa, Kelaniya' },
      { name: 'Brown & Company PLC', email: 'info@brownsgroup.com', contact: '0115588000', address: 'No. 34, Sir Mohamed Macan Markar Mawatha, Colombo 03' },
      { name: 'Abans Engineering (Pvt) Ltd', email: 'abanseng@abansgroup.com', contact: '0115776100', address: 'No. 498, Galle Road, Colombo 03' }
    ]);
    console.log(`Created ${bidders.length} bidders/suppliers`);

    // 6. COMMITTEES (6)
    const committees = await Committee.create([
      { committeeNumber: 'BOC-2026-001', member1: 'Eng. W.A. Perera', member2: 'Eng. Ruwan Mendis', member3: 'Mrs. Sunethra De Silva', appointedDate: new Date('2026-01-15'), status: 'Active' },
      { committeeNumber: 'BOC-2026-002', member1: 'Eng. K.L. Jayasinghe', member2: 'Eng. Nadeeka Herath', member3: 'Eng. Asanka Priyadarshana', appointedDate: new Date('2026-02-01'), status: 'Active' },
      { committeeNumber: 'BOC-2026-003', member1: 'Eng. Chaminda Rathnayake', member2: 'Eng. Dilani Wickramasinghe', member3: 'Eng. Kasun Bandara', appointedDate: new Date('2026-02-20'), status: 'Active' },
      { committeeNumber: 'BOC-2026-004', member1: 'Eng. Mahesh Liyanage', member2: 'Eng. Ruwan Mendis', member3: 'Eng. Nadeeka Herath', appointedDate: new Date('2026-03-10'), status: 'Active' },
      { committeeNumber: 'BOC-2026-005', member1: 'Eng. W.A. Perera', member2: 'Eng. Asanka Priyadarshana', member3: 'Eng. Dilani Wickramasinghe', appointedDate: new Date('2026-04-05'), status: 'Active' },
      { committeeNumber: 'BOC-2026-006', member1: 'Eng. K.L. Jayasinghe', member2: 'Eng. Chaminda Rathnayake', member3: 'Eng. Mahesh Liyanage', appointedDate: new Date('2026-05-12'), status: 'Active' }
    ]);
    console.log(`Created ${committees.length} bid opening committees`);

    // 7. RECORDS / TENDERS (20)
    const recordsData = [
      // Under Evaluation (5 records with delays: 15, 45, 75, 120, 20)
      {
        tenderNumber: 'CEB/CECOM/2026/001',
        relevantTo: 'CECOM',
        category: 'Transformers & Switchgear',
        description: 'Supply and delivery of 33kV/11kV 5MVA power transformers for Western Province Grid Expansion',
        bidStartDate: new Date('2026-01-10'),
        bidOpenDate: new Date('2026-02-15'),
        bidClosingDate: new Date('2026-02-15'),
        fileSentToTecDate: new Date('2026-02-18'),
        bidBondNumber: 'BOC-BB-2026-8812',
        bidBondBank: 'Bank of Ceylon',
        bidValidityPeriod: new Date('2026-06-15'),
        remark: 'Evaluation in progress by TEC Committee BOC-2026-001',
        status: 'Under Evaluation',
        tecCommitteeNumber: 'BOC-2026-001',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Mrs. Sunethra De Silva',
        delay: 15
      },
      {
        tenderNumber: 'CEB/TRN/2026/002',
        relevantTo: 'TRN',
        category: 'Cables & Conductors',
        description: 'Procurement of 132kV underground XLPE power cables and terminal accessories for Kerawalapitiya line',
        bidStartDate: new Date('2025-11-01'),
        bidOpenDate: new Date('2025-12-10'),
        bidClosingDate: new Date('2025-12-10'),
        fileSentToTecDate: new Date('2025-12-15'),
        bidBondNumber: 'PB-BB-2025-4410',
        bidBondBank: "People's Bank",
        bidValidityPeriod: new Date('2026-04-10'),
        remark: 'Awaiting revised price schedule clarification from Sierra Cables',
        status: 'Under Evaluation',
        tecCommitteeNumber: 'BOC-2026-002',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Nadeeka Herath',
        tecMember2: 'Eng. Asanka Priyadarshana',
        delay: 45
      },
      {
        tenderNumber: 'CEB/DIS/2026/003',
        relevantTo: 'DIS',
        category: 'Civil Works & Construction',
        description: 'Construction of primary 33kV distribution substation building at Kandy South',
        bidStartDate: new Date('2025-09-15'),
        bidOpenDate: new Date('2025-10-25'),
        bidClosingDate: new Date('2025-10-25'),
        fileSentToTecDate: new Date('2025-11-01'),
        bidBondNumber: 'SAMPATH-BB-9021',
        bidBondBank: 'Sampath Bank',
        bidValidityPeriod: new Date('2026-03-25'),
        remark: 'Delayed TEC evaluation due to site soil inspection queries',
        status: 'Under Evaluation',
        tecCommitteeNumber: 'BOC-2026-003',
        tecChairman: 'Eng. Chaminda Rathnayake',
        tecMember1: 'Eng. Dilani Wickramasinghe',
        tecMember2: 'Eng. Kasun Bandara',
        delay: 75
      },
      {
        tenderNumber: 'CEB/GEN/2026/004',
        relevantTo: 'GEN',
        category: 'Generators & Power Equipment',
        description: 'Overhaul and rehabilitation of 20MW gas turbine auxiliary generator at Kelanitissa Power Station',
        bidStartDate: new Date('2025-07-01'),
        bidOpenDate: new Date('2025-08-15'),
        bidClosingDate: new Date('2025-08-15'),
        fileSentToTecDate: new Date('2025-08-20'),
        bidBondNumber: 'COMBANK-BB-1102',
        bidBondBank: 'Commercial Bank',
        bidValidityPeriod: new Date('2026-02-15'),
        remark: 'High priority tender pending Ministry approval',
        status: 'Under Evaluation',
        tecCommitteeNumber: 'BOC-2026-005',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Asanka Priyadarshana',
        tecMember2: 'Eng. Dilani Wickramasinghe',
        delay: 120
      },
      {
        tenderNumber: 'CEB/ITD/2026/005',
        relevantTo: 'ITD',
        category: 'IT Equipment & Software',
        description: 'Supply, installation, and commissioning of core enterprise rack servers and SAN storage for CEB Head Office',
        bidStartDate: new Date('2026-02-01'),
        bidOpenDate: new Date('2026-03-01'),
        bidClosingDate: new Date('2026-03-01'),
        fileSentToTecDate: new Date('2026-03-05'),
        bidBondNumber: 'HNB-BB-7712',
        bidBondBank: 'Hatton National Bank',
        bidValidityPeriod: new Date('2026-07-01'),
        remark: 'Technical evaluation of bidder compliance matrices ongoing',
        status: 'Under Evaluation',
        tecCommitteeNumber: 'BOC-2026-004',
        tecChairman: 'Eng. Mahesh Liyanage',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Eng. Nadeeka Herath',
        delay: 20
      },

      // Awarded (4 records)
      {
        tenderNumber: 'CEB/CECOM/2026/006',
        relevantTo: 'CECOM',
        category: 'Transformers & Switchgear',
        description: 'Supply of 100 units of 11kV load break switches and ring main units',
        bidStartDate: new Date('2025-10-01'),
        bidOpenDate: new Date('2025-11-15'),
        bidClosingDate: new Date('2025-11-15'),
        approvedDate: new Date('2025-12-20'),
        bidBondNumber: 'LTL-BB-3301',
        bidBondBank: 'Bank of Ceylon',
        bidValidityPeriod: new Date('2026-03-15'),
        remark: 'Contract signed successfully. Equipment delivery scheduled for May 2026.',
        status: 'Awarded',
        tecCommitteeNumber: 'BOC-2026-001',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Mrs. Sunethra De Silva',
        awardedTo: 'LTL Holdings (Pvt) Ltd',
        serviceAgreementStartDate: new Date('2026-01-01'),
        serviceAgreementEndDate: new Date('2027-01-01'),
        performanceBondNumber: 'BOC-PB-2026-001',
        performanceBondBank: 'Bank of Ceylon',
        performanceBondRemark: 'Performance guarantee valid until Jan 2027',
        delay: 0
      },
      {
        tenderNumber: 'CEB/TRN/2026/007',
        relevantTo: 'TRN',
        category: 'Civil Works & Construction',
        description: 'Foundation and tower erection for 220kV Polpitiya-Hambantota transmission line section 3',
        bidStartDate: new Date('2025-08-01'),
        bidOpenDate: new Date('2025-09-15'),
        bidClosingDate: new Date('2025-09-15'),
        approvedDate: new Date('2025-11-01'),
        bidBondNumber: 'ACCESS-BB-552',
        bidBondBank: 'Commercial Bank',
        bidValidityPeriod: new Date('2026-01-15'),
        remark: 'Awarded to Access Engineering. Site mobilization complete.',
        status: 'Awarded',
        tecCommitteeNumber: 'BOC-2026-002',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Nadeeka Herath',
        tecMember2: 'Eng. Asanka Priyadarshana',
        awardedTo: 'Access Engineering PLC',
        serviceAgreementStartDate: new Date('2025-11-15'),
        serviceAgreementEndDate: new Date('2026-11-15'),
        performanceBondNumber: 'COMBANK-PB-990',
        performanceBondBank: 'Commercial Bank',
        performanceBondRemark: 'Valid through project completion',
        delay: 0
      },
      {
        tenderNumber: 'CEB/ITD/2026/008',
        relevantTo: 'ITD',
        category: 'IT Equipment & Software',
        description: 'Annual maintenance contract and licensing for CEB Billing and Customer Care System (CCMS)',
        bidStartDate: new Date('2025-11-15'),
        bidOpenDate: new Date('2025-12-20'),
        bidClosingDate: new Date('2025-12-20'),
        approvedDate: new Date('2026-01-25'),
        bidBondNumber: 'METRO-BB-881',
        bidBondBank: 'Sampath Bank',
        bidValidityPeriod: new Date('2026-04-20'),
        remark: 'SLA active with 24/7 technical support response',
        status: 'Awarded',
        tecCommitteeNumber: 'BOC-2026-004',
        tecChairman: 'Eng. Mahesh Liyanage',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Eng. Nadeeka Herath',
        awardedTo: 'Metropolitan Technologies (Pvt) Ltd',
        serviceAgreementStartDate: new Date('2026-02-01'),
        serviceAgreementEndDate: new Date('2027-01-31'),
        performanceBondNumber: 'SAMPATH-PB-104',
        performanceBondBank: 'Sampath Bank',
        performanceBondRemark: '10% bank guarantee submitted',
        delay: 0
      },
      {
        tenderNumber: 'CEB/DIS/2026/009',
        relevantTo: 'DIS',
        category: 'Vehicles & Transport',
        description: 'Supply of 15 heavy-duty double cab 4x4 utility pickup vehicles for field breakdown crews',
        bidStartDate: new Date('2025-10-15'),
        bidOpenDate: new Date('2025-11-30'),
        bidClosingDate: new Date('2025-11-30'),
        approvedDate: new Date('2026-01-10'),
        bidBondNumber: 'DIMO-BB-601',
        bidBondBank: 'People\'s Bank',
        bidValidityPeriod: new Date('2026-03-30'),
        remark: 'First batch of 8 vehicles delivered to Kolonnawa Central Stores',
        status: 'Awarded',
        tecCommitteeNumber: 'BOC-2026-006',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Chaminda Rathnayake',
        tecMember2: 'Eng. Mahesh Liyanage',
        awardedTo: 'DIMO PLC',
        serviceAgreementStartDate: new Date('2026-01-15'),
        serviceAgreementEndDate: new Date('2027-01-15'),
        performanceBondNumber: 'PB-PB-4412',
        performanceBondBank: 'People\'s Bank',
        performanceBondRemark: 'Warranty & maintenance bond active',
        delay: 0
      },

      // Retender (3 records)
      {
        tenderNumber: 'CEB/GEN/2026/010',
        relevantTo: 'GEN',
        category: 'Consultancy Services',
        description: 'Consultancy for Environmental Impact Assessment of proposed 100MW Wind Power Project in Mannar Phase II',
        bidStartDate: new Date('2025-09-01'),
        bidOpenDate: new Date('2025-10-15'),
        bidClosingDate: new Date('2025-10-15'),
        bidBondNumber: 'N/A',
        bidBondBank: 'N/A',
        remark: 'Single responsive bidder submitted above budget. Cancelled and referred for retendering with updated TOR.',
        status: 'Retender',
        tecCommitteeNumber: 'BOC-2026-005',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Asanka Priyadarshana',
        tecMember2: 'Eng. Dilani Wickramasinghe',
        delay: 40
      },
      {
        tenderNumber: 'CEB/DIS/2026/011',
        relevantTo: 'DIS',
        category: 'Office Supplies & Stationery',
        description: 'Supply of continuous computer pre-printed stationery for consumer electricity billing islandwide',
        bidStartDate: new Date('2025-11-01'),
        bidOpenDate: new Date('2025-12-05'),
        bidClosingDate: new Date('2025-12-05'),
        bidBondNumber: 'BOC-BB-1092',
        bidBondBank: 'Bank of Ceylon',
        remark: 'Bidders non-compliant with paper GSM specification. Approved for retender.',
        status: 'Retender',
        tecCommitteeNumber: 'BOC-2026-003',
        tecChairman: 'Eng. Chaminda Rathnayake',
        tecMember1: 'Eng. Dilani Wickramasinghe',
        tecMember2: 'Eng. Kasun Bandara',
        delay: 35
      },
      {
        tenderNumber: 'CEB/TRN/2026/012',
        relevantTo: 'TRN',
        category: 'Cables & Conductors',
        description: 'Procurement of 500km ACSR Zebra conductor for transmission line augmentation',
        bidStartDate: new Date('2025-12-01'),
        bidOpenDate: new Date('2026-01-15'),
        bidClosingDate: new Date('2026-01-15'),
        bidBondNumber: 'ACL-BB-7721',
        bidBondBank: 'Hatton National Bank',
        remark: 'Exchange rate fluctuations exceeded contingency limits. Bids rejected and re-advertised.',
        status: 'Retender',
        tecCommitteeNumber: 'BOC-2026-002',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Nadeeka Herath',
        tecMember2: 'Eng. Asanka Priyadarshana',
        delay: 25
      },

      // Re-evaluation (3 records)
      {
        tenderNumber: 'CEB/CECOM/2026/013',
        relevantTo: 'CECOM',
        category: 'Generators & Power Equipment',
        description: 'Supply of 50 units 250kVA silent diesel generators for emergency power supply during grid maintenance',
        bidStartDate: new Date('2025-10-10'),
        bidOpenDate: new Date('2025-11-20'),
        bidClosingDate: new Date('2025-11-20'),
        fileSentToTecDate: new Date('2025-11-25'),
        fileSentToTecSecondTime: new Date('2026-01-15'),
        bidBondNumber: 'BROWNS-BB-301',
        bidBondBank: 'Commercial Bank',
        bidValidityPeriod: new Date('2026-05-20'),
        remark: 'Referred back to TEC for re-evaluation following bidder appeal on technical compliance',
        status: 'Re-evaluation',
        tecCommitteeNumber: 'BOC-2026-001',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Mrs. Sunethra De Silva',
        delay: 50
      },
      {
        tenderNumber: 'CEB/FIN/2026/014',
        relevantTo: 'FIN',
        category: 'IT Equipment & Software',
        description: 'Implementation of Automated Financial Audit and Revenue Reconciliation Software Suite',
        bidStartDate: new Date('2025-11-20'),
        bidOpenDate: new Date('2026-01-05'),
        bidClosingDate: new Date('2026-01-05'),
        fileSentToTecDate: new Date('2026-01-10'),
        fileSentToTecSecondTime: new Date('2026-02-20'),
        bidBondNumber: 'DMS-BB-9920',
        bidBondBank: 'Sampath Bank',
        bidValidityPeriod: new Date('2026-06-05'),
        remark: 'Re-evaluating commercial bid terms following tax structure clarification',
        status: 'Re-evaluation',
        tecCommitteeNumber: 'BOC-2026-004',
        tecChairman: 'Eng. Mahesh Liyanage',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Eng. Nadeeka Herath',
        delay: 30
      },
      {
        tenderNumber: 'CEB/GEN/2026/015',
        relevantTo: 'GEN',
        category: 'Civil Works & Construction',
        description: 'Rehabilitation of spillway gate hoist structures at Victoria Hydro Power Station',
        bidStartDate: new Date('2025-08-15'),
        bidOpenDate: new Date('2025-09-30'),
        bidClosingDate: new Date('2025-09-30'),
        fileSentToTecDate: new Date('2025-10-05'),
        fileSentToTecSecondTime: new Date('2025-12-10'),
        bidBondNumber: 'SANKEN-BB-410',
        bidBondBank: 'Bank of Ceylon',
        bidValidityPeriod: new Date('2026-03-30'),
        remark: 'Second round TEC review requested by Procurement Committee',
        status: 'Re-evaluation',
        tecCommitteeNumber: 'BOC-2026-005',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Asanka Priyadarshana',
        tecMember2: 'Eng. Dilani Wickramasinghe',
        delay: 60
      },

      // Rejected (2 records)
      {
        tenderNumber: 'CEB/DIS/2026/016',
        relevantTo: 'DIS',
        category: 'Office Supplies & Stationery',
        description: 'Procurement of ergonomic office chairs and modular workstation partitions for Colombo North Division',
        bidStartDate: new Date('2025-07-10'),
        bidOpenDate: new Date('2025-08-20'),
        bidClosingDate: new Date('2025-08-20'),
        bidBondNumber: 'ABANS-BB-112',
        bidBondBank: 'People\'s Bank',
        remark: 'All bids rejected due to failure to submit mandatory manufacturer authorization letters.',
        status: 'Rejected',
        tecCommitteeNumber: 'BOC-2026-003',
        tecChairman: 'Eng. Chaminda Rathnayake',
        tecMember1: 'Eng. Dilani Wickramasinghe',
        tecMember2: 'Eng. Kasun Bandara',
        delay: 0
      },
      {
        tenderNumber: 'CEB/TRN/2026/017',
        relevantTo: 'TRN',
        category: 'Vehicles & Transport',
        description: 'Supply of 2 units mobile hydraulic crane trucks (30-ton capacity) for substation line work',
        bidStartDate: new Date('2025-06-01'),
        bidOpenDate: new Date('2025-07-15'),
        bidClosingDate: new Date('2025-07-15'),
        bidBondNumber: 'DIMO-BB-991',
        bidBondBank: 'Commercial Bank',
        remark: 'Bids rejected due to major non-conformance in engine emissions standard',
        status: 'Rejected',
        tecCommitteeNumber: 'BOC-2026-002',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Nadeeka Herath',
        tecMember2: 'Eng. Asanka Priyadarshana',
        delay: 0
      },

      // Cancelled (2 records)
      {
        tenderNumber: 'CEB/ITD/2026/018',
        relevantTo: 'ITD',
        category: 'Consultancy Services',
        description: 'Consultancy services for implementation of Smart Metering IoT Infrastructure and Data Analytics',
        bidStartDate: new Date('2025-05-10'),
        bidOpenDate: new Date('2025-06-20'),
        bidClosingDate: new Date('2025-06-20'),
        bidBondNumber: 'N/A',
        bidBondBank: 'N/A',
        remark: 'Project cancelled due to reallocation of donor funding to renewable energy storage project',
        status: 'Cancelled',
        tecCommitteeNumber: 'BOC-2026-004',
        tecChairman: 'Eng. Mahesh Liyanage',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Eng. Nadeeka Herath',
        delay: 0
      },
      {
        tenderNumber: 'CEB/CECOM/2026/019',
        relevantTo: 'CECOM',
        category: 'Cables & Conductors',
        description: 'Bulk procurement of 33kV insulation tape and splicing kits for distribution maintenance',
        bidStartDate: new Date('2025-06-15'),
        bidOpenDate: new Date('2025-07-25'),
        bidClosingDate: new Date('2025-07-25'),
        bidBondNumber: 'KELANI-BB-402',
        bidBondBank: 'Bank of Ceylon',
        remark: 'Tender cancelled as requirements merged with CEB/CECOM/2026/002 bulk cable package',
        status: 'Cancelled',
        tecCommitteeNumber: 'BOC-2026-001',
        tecChairman: 'Eng. W.A. Perera',
        tecMember1: 'Eng. Ruwan Mendis',
        tecMember2: 'Mrs. Sunethra De Silva',
        delay: 0
      },

      // Closed (1 record)
      {
        tenderNumber: 'CEB/FIN/2026/020',
        relevantTo: 'FIN',
        category: 'Office Supplies & Stationery',
        description: 'Supply of heavy-duty paper shredders and document archiving scanners for Finance Division',
        bidStartDate: new Date('2025-04-01'),
        bidOpenDate: new Date('2025-05-10'),
        bidClosingDate: new Date('2025-05-10'),
        approvedDate: new Date('2025-06-01'),
        bidBondNumber: 'METRO-BB-311',
        bidBondBank: 'Sampath Bank',
        remark: 'Full delivery completed, final payment released, contract file closed.',
        status: 'Closed',
        tecCommitteeNumber: 'BOC-2026-006',
        tecChairman: 'Eng. K.L. Jayasinghe',
        tecMember1: 'Eng. Chaminda Rathnayake',
        tecMember2: 'Eng. Mahesh Liyanage',
        awardedTo: 'Metropolitan Technologies (Pvt) Ltd',
        serviceAgreementStartDate: new Date('2025-06-15'),
        serviceAgreementEndDate: new Date('2025-12-15'),
        performanceBondNumber: 'SAMPATH-PB-802',
        performanceBondBank: 'Sampath Bank',
        delay: 0
      }
    ];

    const records = await Record.create(recordsData);
    console.log(`Created ${records.length} tender records`);

    console.log('----------------------------------------------------');
    console.log('CEB Tender Management System seeding complete!');
    console.log('Summary of resources created:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Staff: ${staffMembers.length}`);
    console.log(`- Bidders: ${bidders.length}`);
    console.log(`- Committees: ${committees.length}`);
    console.log(`- Tender Records: ${records.length}`);
    console.log('- Demo Accounts:');
    console.log('  * Admin: abc@gmail.com / ABC@123');
    console.log('  * Procurement: procurement@ceb-tms.local / Procurement@123');
    console.log('  * CECOM: cecom@ceb-tms.local / Cecom@123');
    console.log('  * Clerk: clerk@ceb-tms.local / Clerk@123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  }
}

if (require.main === module) {
  connectDB().then(async () => {
    await populateSeedData();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { populateSeedData };