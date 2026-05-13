const STATUS_CONFIG = {
  complete:            { label: 'UI ready',      variant: 'success' },
  'concept-ready':     { label: 'Brief ready',   variant: 'success' },
  'generating-concept':{ label: 'Drafting brief', variant: 'warning' },
  'generating-ui':     { label: 'Building UI',   variant: 'warning' },
  draft:               { label: 'Draft',         variant: 'info' },
  failed:              { label: 'Failed',        variant: 'error' },
  deleted:             { label: 'Deleted',       variant: 'error' },
};

const StatusBadge = ({ status }) => {
  const { label, variant } = STATUS_CONFIG[status] || { label: status, variant: 'info' };
  return <span className={`badge badge-${variant}`}>{label}</span>;
};

export default StatusBadge;
