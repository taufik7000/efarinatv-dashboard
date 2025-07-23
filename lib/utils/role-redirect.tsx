// lib/utils/role-redirect.ts
import { UserRole } from "@prisma/client";

export function getRoleDashboardPath(role: UserRole | string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'direktur':
      return '/direktur';
    case 'keuangan':
      return '/keuangan';
    case 'redaksi':
      return '/redaksi';
    case 'hrd':
      return '/hrd';
    case 'marketing':
      return '/marketing';
    case 'team':
      return '/team';
    default:
      return '/team'; // Default fallback ke team dashboard
  }
}

export function isValidRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    'admin',
    'direktur', 
    'keuangan',
    'redaksi',
    'hrd',
    'marketing',
    'team'
  ];
  return validRoles.includes(role as UserRole);
}