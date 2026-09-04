require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function populateSeedData() {
  console.log('Seeding CEB Tender Management System data to Supabase...');
  try {
    // 1. Demo Accounts (5-digit numeric EPF numbers)
    const demoAccounts = [
      { name: 'Demo Admin', email: 'abc@gmail.com', epfNumber: '10001', password: 'ABC@123', role: 'Admin' },
      { name: 'Demo Procurement Officer', email: 'procurement@ceb-tms.local', epfNumber: '10002', password: 'Procurement@123', role: 'Procurement' },
      { name: 'Demo CECOM Officer', email: 'cecom@ceb-tms.local', epfNumber: '10003', password: 'Cecom@123', role: 'CECOM' },
      { name: 'Demo Clerk', email: 'clerk@ceb-tms.local', epfNumber: '10004', password: 'Clerk@123', role: 'Clerk' }
    ];

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
        await supabase.from('users').update({
          password: hash,
          name: acc.name,
          epf_number: acc.epfNumber,
          role: acc.role,
          status: 'Active'
        }).eq('id', existingUser.id);
        console.log(`Updated demo user: ${acc.email} (${acc.role})`);
      }
    }

    // 2. Demo Categories
    const categories = [
      { name: 'Goods', description: 'General Goods & Heavy Equipment', status: 'Active' },
      { name: 'Services', description: 'Consultancy & Technical Services', status: 'Active' },
      { name: 'Works', description: 'Civil Engineering & Construction Works', status: 'Active' },
      { name: 'Consultancy', description: 'Specialized Engineering Advisory Services', status: 'Active' }
    ];

    for (const cat of categories) {
      const { data: existingCat } = await supabase.from('categories').select('id').eq('name', cat.name).maybeSingle();
      if (!existingCat) {
        await supabase.from('categories').insert([cat]);
        console.log(`Created category: ${cat.name}`);
      }
    }

    // 3. Demo Departments
    const departments = [
      { name: 'Generation', code: 'GEN', head_of_department: 'Eng. P. Bandara', description: 'Power Generation Division', status: 'Active' },
      { name: 'Transmission', code: 'TRN', head_of_department: 'Eng. K. Fernando', description: 'High Voltage Transmission Grid', status: 'Active' },
      { name: 'Distribution', code: 'DST', head_of_department: 'Eng. R. De Silva', description: 'Electricity Distribution Network', status: 'Active' }
    ];

    for (const dept of departments) {
      const { data: existingDept } = await supabase.from('departments').select('id').eq('name', dept.name).maybeSingle();
      if (!existingDept) {
        await supabase.from('departments').insert([dept]);
        console.log(`Created department: ${dept.name}`);
      }
    }

    // 4. Demo Committees
    const committees = [
      {
        committee_number: 'TEC/2023/001',
        member1: 'K.A. Perera',
        member2: 'M.B. Silva',
        member3: 'S.C. Fernando',
        additional_members: ['Eng. D. Jayasooriya'],
        appointed_date: '2023-01-15',
        status: 'Active'
      },
      {
        committee_number: 'TEC/2023/002',
        member1: 'D.E. Wickramasinghe',
        member2: 'G.H. Jayawardena',
        member3: 'I.J. Rajapaksa',
        additional_members: [],
        appointed_date: '2023-02-20',
        status: 'Active'
      }
    ];

    for (const comm of committees) {
      const { data: existingComm } = await supabase.from('committees').select('id').eq('committee_number', comm.committee_number).maybeSingle();
      if (!existingComm) {
        await supabase.from('committees').insert([comm]);
        console.log(`Created committee: ${comm.committee_number}`);
      }
    }

    // 5. Demo Bidders
    const bidders = [
      { name: 'Lanka Electrical Co.', email: 'info@lankaelectrical.lk', contact: '+94112345678', address: 'Colombo 03' },
      { name: 'PowerTech Solutions', email: 'contact@powertech.lk', contact: '+94771234567', address: 'Kandy' }
    ];

    for (const b of bidders) {
      const { data: existingB } = await supabase.from('bidders').select('id').eq('name', b.name).maybeSingle();
      if (!existingB) {
        await supabase.from('bidders').insert([b]);
        console.log(`Created bidder: ${b.name}`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('CEB Tender Management System seeding complete!');
    console.log('Demo Accounts Verified:');
    console.log('  * Admin: abc@gmail.com / ABC@123 (EPF: 10001)');
    console.log('  * Procurement: procurement@ceb-tms.local / Procurement@123 (EPF: 10002)');
    console.log('  * CECOM: cecom@ceb-tms.local / Cecom@123 (EPF: 10003)');
    console.log('  * Clerk: clerk@ceb-tms.local / Clerk@123 (EPF: 10004)');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  }
}

if (require.main === module) {
  populateSeedData().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { populateSeedData };