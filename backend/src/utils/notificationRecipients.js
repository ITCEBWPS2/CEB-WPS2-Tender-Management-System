/**
 * Returns the list of email notification recipients for a given tender record.
 * 
 * Recipients:
 * 1. All active users with role 'Admin' or 'Super Admin'
 *
 * @param {Object} supabaseClient - Initialized Supabase client instance
 * @param {Object} record - The tender record being checked
 * @returns {Promise<Array<{email: string, role: string}>>}
 */
async function getNotificationRecipients(supabaseClient, record) {
  try {
    const { data: adminUsers, error } = await supabaseClient
      .from('users')
      .select('email, role')
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
              role: u.role || 'Admin'
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

module.exports = {
  getNotificationRecipients
};
