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

export const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
