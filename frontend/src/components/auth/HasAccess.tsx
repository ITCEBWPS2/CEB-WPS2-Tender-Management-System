import React from 'react';

interface HasAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const HasAccess: React.FC<HasAccessProps> = ({ allowedRoles, children }) => {
 
  const userRole = localStorage.getItem('role') || 'Guest';

  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
};