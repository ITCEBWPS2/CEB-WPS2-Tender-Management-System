require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function populateSeedData() {
  console.log('Seeding CEB Tender Management System data to Supabase...');
  try {
    const demoAccounts = [
      { name: 'Demo Admin', email: 'abc@gmail.com', epfNumber: 'EPF001', password: 'ABC@123', role: 'Admin' },
      { name: 'Demo Procurement Officer', email: 'procurement@ceb-tms.local', epfNumber: 'EPF002', password: 'Procurement@123', role: 'Procurement' },
      { name: 'Demo CECOM Officer', email: 'cecom@ceb-tms.local', epfNumber: 'EPF003', password: 'Cecom@123', role: 'CECOM' },
      { name: 'Demo Clerk', email: 'clerk@ceb-tms.local', epfNumber: 'EPF004', password: 'Clerk@123', role: 'Clerk' }
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
        console.log(`Updated/preserved demo user: ${acc.email} (${acc.role})`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('CEB Tender Management System seeding complete!');
    console.log('Demo Accounts Verified:');
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
  populateSeedData().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { populateSeedData };