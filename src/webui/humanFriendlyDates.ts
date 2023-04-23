// Implementation after: https://phrase.com/blog/posts/a-human-friendly-way-to-display-dates-in-typescript-javascript/

import { STRINGS } from "../language/default";

/**
 * Past this number of days we'll no longer display the 
 * day of the week and instead we'll display the date
 * with the month
 */
const DATE_WITH_MONTH_THRESHOLD_IN_DAYS: number = 6;
const DATE_WITH_YEAR_THRESHOLD_IN_MONTHS: number = 6;

/**
 * Past this number of seconds it's now longer "now" when
 * we're displaying dates
 */
const NOW_THRESHOLD_IN_SECONDS: number = 10;

/**
 * Past this number of hours we'll no longer display "hours
 * ago" and instead we'll display "today"
 */
const TODAY_AT_THRESHOLD_IN_HOURS: number = 12;

// Constants
const MILLISECONDS_TO_SECONDS: number = 0.001;
const SECONDS_IN_YEAR: number = 31557600;
const SECONDS_IN_MONTH: number = 2629800;
const SECONDS_IN_DAY: number = 86400;
const SECONDS_IN_HOUR: number = 3600;
const SECONDS_IN_MINUTE: number = 60;

/**
 * Representation of a date & time in components
 */
interface DateTimeComponents {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Options when formatting a date
 */
interface DateFormatOptions {
    includeYear?: Boolean;
    length?: "long" | "short" | "narrow" | undefined;
}

/**
 * Retrieve a human-friendly date string relative to now and in the
 * current locale e.g. "two minutes ago"
 */
export function humanFriendlyDate(date: Date, length: "long" | "short" | "narrow" | undefined = "long"): string {
    let now: Date = new Date()
    const diffComponents: DateTimeComponents = getDateTimeComponents(now, date);
    const { hours, minutes, seconds } = diffComponents;

    let nowDay = new Date(now.toISOString().substring(0, 10))
    let dateDay = new Date(date.toISOString().substring(0, 10))
    const diffComponentsFullDays: DateTimeComponents = getDateTimeComponents(nowDay, dateDay);
    const { years, months, days } = diffComponentsFullDays;

    if (years > 100) {
        return "unknown"
    }

    if (years > 0 || months > DATE_WITH_YEAR_THRESHOLD_IN_MONTHS) {
        return formatDate(date, { includeYear: true, length: length });
    }

    if (months > 0 || days > DATE_WITH_MONTH_THRESHOLD_IN_DAYS) {
        return formatDate(date, { includeYear: false, length: length });
    }

    if (days > 1) {
        return date.toLocaleDateString(STRINGS.TIME_LOCALE, { weekday: length });
    }

    if (days === 1) {
        return STRINGS.TIME_YESTERDAY;
    }

    if (hours > TODAY_AT_THRESHOLD_IN_HOURS) {
        return STRINGS.TIME_TODAY_AT + " " +
            date.toLocaleTimeString(STRINGS.TIME_LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    if (hours > 0) {
        return STRINGS.APPLY_COUNTED(hours, STRINGS.TIME_HOURS_AGO);
    }

    if (minutes > 0) {
        return STRINGS.APPLY_COUNTED(minutes, STRINGS.TIME_MINUTES_AGO);
    }

    if (seconds > NOW_THRESHOLD_IN_SECONDS) {
        return STRINGS.APPLY_COUNTED(seconds, STRINGS.TIME_SECONDS_AGO);
    }

    return STRINGS.TIME_JUST_NOW;
}

/**
 * Format an English date with it ordinal e.g. "May 1st, 1992"
 */
function formatDate(date: Date, { includeYear, length }: DateFormatOptions): string {
    const month: string = date.toLocaleDateString(STRINGS.TIME_LOCALE, { month: length });
    const day: string = date.getDate().toString();

    let formatted: string = `${day}. ${month}`;
    if (includeYear) {
        formatted += ` ${date.getFullYear()}`;
    }
    return formatted;
}

/**
 * Convert milliseconds to seconds
 */
function millisecondsToSeconds(milliseconds: number): number {
    return Math.floor(milliseconds * MILLISECONDS_TO_SECONDS);
}

/**
 * Break up a unix timestamp into its date & time components
 */
function getDateTimeComponents(now: Date, then: Date): DateTimeComponents {
    const components: DateTimeComponents = {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    };

    let remaining: number = millisecondsToSeconds(now.valueOf()) - millisecondsToSeconds(then.valueOf());
    // years
    components.years = Math.floor(remaining / SECONDS_IN_YEAR);
    remaining -= components.years * SECONDS_IN_YEAR;

    // months
    components.months = Math.floor(remaining / SECONDS_IN_MONTH);
    remaining -= components.months * SECONDS_IN_MONTH;

    // days
    components.days = Math.floor(remaining / SECONDS_IN_DAY);
    remaining -= components.days * SECONDS_IN_DAY;

    // hours
    components.hours = Math.floor(remaining / SECONDS_IN_HOUR);
    remaining -= components.hours * SECONDS_IN_HOUR;

    // minutes
    components.minutes = Math.floor(remaining / SECONDS_IN_MINUTE);
    remaining -= components.minutes * SECONDS_IN_MINUTE;

    // seconds
    components.seconds = remaining;
    return components;
}