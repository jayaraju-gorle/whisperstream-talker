export function canManageBusinessPhone(ownerId: string | undefined, userId: string) {
  return Boolean(ownerId) && ownerId === userId;
}