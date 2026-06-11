export function calculatePayout(totalAmount: number) {
  const platformFee = +(totalAmount * 0.1).toFixed(2);
  const ownerPayout = +(totalAmount * 0.9).toFixed(2);

  return {
    platformFee,
    ownerPayout,
  };
}
