export const formatOdds = (odds) => {
  if (odds === 100) {
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
