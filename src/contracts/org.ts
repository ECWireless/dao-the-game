export type OrgTreeRecord = {
  playerId: string;
  chainId: number;
  topHatId: string;
  studioName: string | null;
  wearerAddress: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgRoleHatRecord = {
  playerId: string;
  roleId: string;
  roleName: string;
  chainId: number;
  hatId: string;
  adminHatId: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgTreeUpsertRequest = {
  chainId: number;
  topHatId: string;
  studioName?: string | null;
  wearerAddress: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
};

export type OrgTreeUpsertResponse = {
  orgTree: OrgTreeRecord;
};

export type OrgRoleHatUpsertRequest = {
  roleId: string;
  roleName: string;
  chainId: number;
  hatId: string;
  adminHatId: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
};

export type OrgRoleHatUpsertResponse = {
  orgRoleHat: OrgRoleHatRecord;
};
