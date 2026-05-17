export function deriveInstitutionId(walletAddress: string): number {
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = ((hash << 5) - hash) + walletAddress.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 900000 + 100000;
}
