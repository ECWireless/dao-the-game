const ROLE_AFFINITY_LABELS: Record<string, string[]> = {
  'hat-01': ['Frontend Builder', 'Responsive Engineer'],
  'hat-02': ['Product Designer', 'Brand Systems Designer'],
  'hat-03': ['QA Reviewer', 'Launch Tester'],
  'hat-04': ['Release Operator', 'Deployment Engineer']
};

export function getRoleAffinityLabel(roleId: string, variant = 0): string {
  const options = ROLE_AFFINITY_LABELS[roleId];

  if (!options?.length) {
    return 'Specialist';
  }

  return options[variant % options.length];
}
