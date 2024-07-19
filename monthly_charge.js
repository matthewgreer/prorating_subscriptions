/**
 * Returns the monthly charge for a given subscription.
 *
 * @param {String} month - Always present. Has the following structure: 'YYYY-MM'. For example, '2020-01' for January 2020.
 * @param {Object|null} subscription - May be null. If present, has the following structure:
 * @typedef {Object} Subscription
 * {
 *   id: Number,
 *   customerId: Number,
 *   monthlyPriceInCents: Number,
 * }
 * @param {Array<Object>} users - May be empty but not null. Each user has the following structure:
 * @typedef {Object} User
 * {
 *   id: Number,
 *   name: String,
 *   customerId: Number,
 *   activatedOn: Date,
 *   deactivatedOn: Date|null,
 * }
 * @returns {number} - The monthly charge for a subscription in cents, rounded to the nearest cent. For example, a $20.00 charge should return 2000. If there are no active users, or the subscription is null, return 0.
 */

const monthlyCharge = (month, subscription, users) => {
  if (subscription === null || users.length === 0) return 0;

  const millisecondsInOneDay = 86400000;
  const firstDayOfMonthInMS = Date.parse(month);

  // to calculate the first day of the next month, which we'll need to ensure that deactivation ON the last day of the month still accrues a charge for that last day.
  let yearMonth = month.split('-').map(n => parseInt(n));

  if (yearMonth[1] === 12) {
    yearMonth[0] += 1;
    yearMonth[1] = 0;
  }

  const firstOfNextMonthInMS = Date.UTC(yearMonth[0], yearMonth[1]);
  // if we use the last day of the passed month, rather than the first day of the next month, we will not wind up counting the last day of the month.
  const totalDaysInMonth = (firstOfNextMonthInMS - firstDayOfMonthInMS) / millisecondsInOneDay;
  const monthlyCost = subscription.monthlyPriceInCents;
  const dailyCost = Math.ceil(monthlyCost / totalDaysInMonth); // round up to the nearest cent.
  console.log('==============================================')
  console.log('Monthly rate: ', monthlyCost, '. Days in month: ', totalDaysInMonth, '. Daily rate:', dailyCost)


  let totalDays = 0;
  let totalCost = 0; // in cents, remember!

  for (const user of users) {
    const activatedOnInMS = Date.parse(user.activatedOn);
    const deactivatedOnInMS = user.deactivatedOn ? Date.parse(user.deactivatedOn) + millisecondsInOneDay : Infinity; // the user should be charged for the day upon which they deactivated

    if (activatedOnInMS >= firstOfNextMonthInMS || deactivatedOnInMS < firstDayOfMonthInMS) continue; // if the user activated after this month, or deactivated before this month, they do not accrue charges, so move on to the next user

    if (activatedOnInMS < firstDayOfMonthInMS && deactivatedOnInMS >= firstOfNextMonthInMS) {
      // if the user activated before the month started AND did not deactivate before the beginning of next month, save the caculations, just charge the full monthly charge and move on.
      totalDays += totalDaysInMonth;
      totalCost += monthlyCost;

    console.log(user.name, 'charged for entire month. Subtotal: ', monthlyCost, '. Total Days: ', totalDays, '. Total Cost: ', totalCost);
      continue;
    }

    const startDay = activatedOnInMS <= firstDayOfMonthInMS ? firstDayOfMonthInMS : activatedOnInMS;

    const endDay = deactivatedOnInMS >= firstOfNextMonthInMS ? firstOfNextMonthInMS : deactivatedOnInMS;

    const userChargedDays = (endDay - startDay) / millisecondsInOneDay;

    const userCost = (userChargedDays * dailyCost);

    totalDays += userChargedDays;
    totalCost += userCost;

    console.log(user.name, 'charged for ', userChargedDays, 'days at ', dailyCost, 'per day. Subtotal: ', userCost, '. Total Days: ', totalDays, '. Total Cost: ', totalCost);
  }

  if (totalDays % totalDaysInMonth === 0) {
    totalCost = totalDays / totalDaysInMonth * monthlyCost;
    console.log('Total Days is a multiple of # of days in month. Adjusting Total Cost to eliminate rounding creep.', totalCost)
  }

  return totalCost;
}

module.exports = monthlyCharge;


/*
  MY THINKING:

    - if there are no active users or subscription is null, return 0
    - first, take the month string and calculate the number of days in that month.
    - next, divide the subscription.monthlyPriceInCents by the number of days in the month to get the daily rate for that month.
    - establish a running total
    - iterate over the users and
      - get the user's first and last days to be charged by checking:
        - the user.activatedOn Date
          - if after the last date of this month, the customer has no active days this month and will not accrue any charges for the month
          - if before or on the first day of the month, the first day of the month is the first day they are charged for this month
          - if in-between the first day of the month and the last day of the month, that date is the first day they will be charged for this month
        - the user.deactivatedOn Date
          - if null or on or later than the last date of this month, the last date of the month is the last day they are charged for this month
          - if after the first day they will be charged for the month but before the last day of the month
      - calculate the total charge per customer by finding the number of days between first day charged and last day charged (if just taking the difference in date numbers, add 1 to ensure both the first and last days are included in the charge) and multiplying that number of days by the daily rate
      - increment the running total and move to the next user
    - lastly, return the running total!

    now one of the pitfalls is timezones. calling Date.parse(month) returns ms, new Date(month) returns Date obj, but both are considered UTC unless a time is specified (which month parameter does not). so we should choose either Date obj in UTC or Epoch ms and be consistent throughout. which will be better?

    say month = '2020-12'

    firstDayOfMonth = new Date(month); => Date obj Dec 01 2020 00:00:000 UTC
    firstDayOfMonthMS = firstDayOfMonth.valueOf(); OR Date.parse(month); => 1606780800000

    to calculate the last day of the month from date is more involved. but we can take advantage of the fact that JS indexes dates 0 - 11, not 1 - 12.
    yearMonth = date.split('-').map(n => parseInt(n)) [2020, 12])

    if (yearMonth[1] === 12) {
      yearMonth[0] += 1;
      yearMonth[1] = 0;
    }

    firstOfFollowingMonthMS = Date.UTC(yearMonth[0], yearMonth[1]) => 1609459200000

    lastDayOfMonthMS = firstOfFollowingMonthMS - 86400000 (# of ms in 1 day)

    lastDayOfMonth = new Date(0); => Date obj Jan 1 1970 00:00:000 UTC
    lastDayOfMonth.setUTCMilliseconds(lastDayOfMonthMS); => Date obj Dec 31 2020 00:00:000 UTC

    So now we have UTC Date Objects for first and last days of the month. But subtracting, adding, comparing etc of Date objects is just using ms anyway (and will return ms).

    *** Looks like it might be better to just use ms for the whole shebang. ***

    One interesting conundrum is that due to rounding with the daily rate, one could actually be charged slightly more than the monthly rate for 2 users with a combined total of days equal to the total days in the month. How would you address that? Total days % number of days in the month? If it's an exact multiple (=== 0), charge (total days/number of days in the month) * monthly rate?
  */
