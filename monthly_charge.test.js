const monthlyCharge = require('./monthly_charge');

test('monthlyCharge returns 100', () => {
  expect(monthlyCharge()).toBe(100);
});
