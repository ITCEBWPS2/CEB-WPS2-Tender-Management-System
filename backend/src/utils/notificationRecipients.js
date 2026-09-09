/**
 * Returns the list of email notification recipients for a given tender record.
 * 
 * Default recipients: All active users with role 'Admin' or 'Super Admin'
 *
 * @param {Object} supabaseClient - Initialized Supabase client instance
 * @param {Object} [record] - Optional tender record object
 * @returns {Promise<Array<{email: string, role: string, name?: string}>>}
 */
async function getNotificationRecipients(supabaseClient, record = null) {
  try {
    const { data: adminUsers, error } = await supabaseClient
      .from('users')
      .select('email, role, name')
      .in('role', ['Admin', 'Super Admin'])
      .eq('status', 'Active');

    if (error) {
      console.error('Error fetching admin recipients:', error);
      return [];
    }

    const recipientsMap = new Map();

    if (Array.isArray(adminUsers)) {
      adminUsers.forEach(u => {
        if (u.email && u.email.trim()) {
          const cleanEmail = u.email.trim().toLowerCase();
          if (!recipientsMap.has(cleanEmail)) {
            recipientsMap.set(cleanEmail, {
              email: cleanEmail,
              role: u.role || 'Admin',
              name: u.name || 'Administrator'
            });
          }
        }
      });
    }

    return Array.from(recipientsMap.values());
  } catch (err) {
    console.error('Unexpected error in getNotificationRecipients:', err);
    return [];
  }
}

/**
 * Returns recipients for a TEC appointment notification:
 * - All active Admins/Super Admins
 * - Appointed committee members if their emails can be found in the staff or users tables
 *
 * @param {Object} supabaseClient
 * @param {Object} record
 * @returns {Promise<Array<{email: string, role: string, name?: string}>>}
 */
async function getTecAppointmentRecipients(supabaseClient, record) {
  const recipients = await getNotificationRecipients(supabaseClient, record);
  const recipientsMap = new Map(recipients.map(r => [r.email.toLowerCase(), r]));

  try {
    const memberNames = [
      record.tec_chairman || record.tecChairman,
      record.tec_member1 || record.tecMember1,
      record.tec_member2 || record.tecMember2
    ].filter(Boolean).map(n => n.trim());

    if (memberNames.length > 0) {
      // 1. Check staff table for matching member names
      const { data: staffList, error: staffError } = await supabaseClient
        .from('staff')
        .select('name, email, designation')
        .in('name', memberNames);

      if (!staffError && Array.isArray(staffList)) {
        staffList.forEach(s => {
          if (s.email && s.email.trim()) {
            const cleanEmail = s.email.trim().toLowerCase();
            if (!recipientsMap.has(cleanEmail)) {
              recipientsMap.set(cleanEmail, {
                email: cleanEmail,
                role: 'TEC Member',
                name: s.name
              });
            }
          }
        });
      }

      // 2. Check users table for matching member names
      const { data: userList, error: userError } = await supabaseClient
        .from('users')
        .select('name, email, role')
        .in('name', memberNames)
        .eq('status', 'Active');

      if (!userError && Array.isArray(userList)) {
        userList.forEach(u => {
          if (u.email && u.email.trim()) {
            const cleanEmail = u.email.trim().toLowerCase();
            if (!recipientsMap.has(cleanEmail)) {
              recipientsMap.set(cleanEmail, {
                email: cleanEmail,
                role: u.role || 'TEC Member',
                name: u.name
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not resolve TEC member emails from staff table:', err);
  }

  return Array.from(recipientsMap.values());
}

module.exports = {
  getNotificationRecipients,
  getTecAppointmentRecipients
};
