const monthlyCharge = require('./monthly_charge');

// NOTE: be careful, when creating dummy test data, to create activation/deactivation dates as JS Date objects at 00:00:000 in UTC time. Use constructor (i.e. new Date('')) and pass a date string, but DON'T pass a time or it will make the Date in local timezone.

const date1 = '2020-09'; // 30 days hath september
const subscription1 = {
  id: 1,
  customerId: 1,
  monthlyPriceInCents: 3000,
};
const users1 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: null,
  },
];

test('returns 0 if subscription is null', () => {
  expect(monthlyCharge(date1, null, users1)).toBe(0);
});

test('returns 0 if users array is empty', () => {
  expect(monthlyCharge(date1, subscription1, [])).toBe(0);
});

test('returns 3000 for 1 user for full month', () => {
  expect(monthlyCharge(date1, subscription1, users1)).toBe(3000);
});

const users2 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: null,
  },
  {
    id: 2,
    name: 'Bob',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: null,
  },
];

test('returns 6000 for 2 users for full month', () => {
  expect(monthlyCharge(date1, subscription1, users2)).toBe(6000);
});

const users3 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: null,
  },
  {
    id: 2,
    name: 'Bob',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: new Date('2020-09-15'),
  },
];

test('returns 4500 for 2 users, one full 30 day onth and one deactivated halfway through month', () => {
  expect(monthlyCharge(date1, subscription1, users3)).toBe(4500);
});

const users4 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2020-09-16'), // after date1
    deactivatedOn: null,
  },
  {
    id: 2,
    name: 'Bob',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: new Date('2020-09-15'),
  },
];

test('returns 3000 for 2 users, one starting and one deactivating halfway through 30 day month', () => {
  expect(monthlyCharge(date1, subscription1, users4)).toBe(3000);
});

date2 = '2020-08'; // august has 31 days

const users5 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: null,
  },
  {
    id: 2,
    name: 'Bob',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: new Date('2020-08-15'),
  },
];

test('returns 4455 for 2 users, one full 31 day month and one deactivated halfway through month', () => {
  expect(monthlyCharge(date2, subscription1, users5)).toBe(4455);
});

const users6 = [
  {
    id: 1,
    name: 'Alice',
    customerId: 1,
    activatedOn: new Date('2020-08-16'), // after date1
    deactivatedOn: null,
  },
  {
    id: 2,
    name: 'Bob',
    customerId: 1,
    activatedOn: new Date('2019-01-01'), // before date1
    deactivatedOn: new Date('2020-08-15'),
  },
];

test('returns 3000, not 3007, for 2 users, one starting and one deactivating halfway through 31 day month, with 31 total days', () => {
  expect(monthlyCharge(date2, subscription1, users6)).toBe(3000);
});
