export const formatOdds = (odds) => {
  // It's practically 100
  if (odds > 99.99) {
    return '100% ✓';
  }

  return `${Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 2,
    },
  ).format(odds)}%`;
};

// eslint-disable-next-line no-bitwise
export const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
