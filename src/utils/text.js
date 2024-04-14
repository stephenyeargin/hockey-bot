export const formatOdds = (odds) => {
  // Don't render if undefined
  if (odds === undefined) {
    return '';
  }

  // It's practically 100
  if (odds >= 99.995) {
    return '100% ✓';
  }

  // It's practically 0
  if (odds <= 0.001) {
    return '0% ×';
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
