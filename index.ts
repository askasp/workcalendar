import { format, isBefore, subMinutes, addMinutes, isAfter, differenceInMinutes, parse, addDays, isWeekend} from 'date-fns'
import * as process from "process";

// ASSUMPTIONS and simplifications
// 1. All time formats are given in in UTC format
// 2. It is not possible to work a night shift. that is, you cannot have midnight between workdaystart and workdayend
// 3. Floating number precision is not accounted for


// -------------------------------------------HELPERS -------------------------------------
enum TimeDirection {
    Forward,
    Backward
}

interface WorkDaySchedule{
    hours: number;
    minutes: number
}
interface Holiday {
    year: number;
    month: number;
    day: number;
}
interface RecurringHoliday extends Omit<Holiday,"year">{}

var args = process.argv.slice(2);
const commandLineInput = JSON.parse(args[0])
//JS is not very smart on dates,  force everything to UTC time
const unparsedDate = commandLineInput.StartDate+":00.000Z"


// Remove hours outside working hours as they are irrelevant
const parseStartDate = (unparsedDate, workDayStart:any, workDayStop:any) => {
    const startDate = parse(unparsedDate, "dd-MM-yyyy' 'HH:mm:ss.SSSX", new Date())
    const workStartDateTime = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), commandLineInput.WorkdayStart.Hours, commandLineInput.WorkdayStart.Minutes))
    const workEndDateTime = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), commandLineInput.WorkdayStop.Hours, commandLineInput.WorkdayStop.Minutes))
    if (isAfter(startDate, workEndDateTime)){
        return workEndDateTime
    }
    if (isBefore(startDate,workStartDateTime)) {
        return workStartDateTime
    }
    return startDate
}

// Do validation here
const parseHolidays = (unparsedHolidays: any): Holiday[] => {
    return unparsedHolidays.map((holiday) => {
            return {year: holiday.Year, month:holiday.Month, day:holiday.Day }} )
}

// Do validation here
const parseRecurringHolidays = (unparsedHolidays: any): RecurringHoliday[] => unparsedHolidays.map((recurringHoliday) => {
        return {month:recurringHoliday.Month, day:recurringHoliday.Day }} )

// Do validation here
const parseWorkdaySchedule = (unparsedWorkday: any): WorkDaySchedule => {
    return {hours:unparsedWorkday.Hours, minutes: unparsedWorkday.Minutes }
}

const isHoliday = (date:Date, holidays: Holiday[]) => {
    for (const holiday of holidays){
        if (date.getUTCDate() === holiday.day && date.getUTCMonth() +1 === holiday.month) {
            return true
        }
    }
    return false
}

const isRecurringHoliday = (date:Date, recurringHolidays: RecurringHoliday[]) => {
    for (const recurringHoliday of recurringHolidays) {
        if (date.getUTCMonth() + 1 === recurringHoliday.month && date.getUTCDate() === recurringHoliday.day) {
            return true
        }
    }
    return false
}


// Recursive function that steps to the next day until all workdays are used up
// It then returns the current date
const getLastWorkday = (currentDate, workDaysLeft, timeDirection:TimeDirection, holidays: Holiday[], recurringHolidays: RecurringHoliday[]) => {
    const nextDate = timeDirection === TimeDirection.Forward? addDays(currentDate,1): addDays(currentDate, -1)

    if (isHoliday(currentDate, holidays) || isRecurringHoliday(currentDate, recurringHolidays) || isWeekend(currentDate)){
        return getLastWorkday(nextDate, workDaysLeft, timeDirection, holidays, recurringHolidays)
    }
    if (workDaysLeft - 1 === 0){
        return currentDate
    }
    return getLastWorkday(nextDate, workDaysLeft - 1, timeDirection, holidays, recurringHolidays)
}

// Calculates how much work was done on the start date as a fraction of a full days work
const getWorkDoneOnStartDay = (workdayStart: WorkDaySchedule, workdayEnd: WorkDaySchedule, startDate: Date, timeDirection: TimeDirection, holidays: Holiday[], recurringHolidays: RecurringHoliday[]) => {
    if (isHoliday(startDate, holidays) || isRecurringHoliday(startDate, recurringHolidays) || isWeekend(startDate)){
        return 0
    }
    const workStartDateTime = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), workdayStart.hours, workdayStart.minutes))
    const workEndDateTime = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), workdayEnd.hours, workdayEnd.minutes))
    const minutesInWorkday =  differenceInMinutes(workEndDateTime,workStartDateTime)

    if (timeDirection === TimeDirection.Backward){
        if (isBefore(startDate, workStartDateTime)){
            return 0 // Moving backwards in time and the startdate is before work starts, that is, no work done this day
        }
        if (isAfter(startDate, workEndDateTime)){
            return 1 // Moving backwards in time and the startdate is after work end, counts as full workday
        }
        // a fraction is done, counted backward in time from startDate to the start of the workday
        return differenceInMinutes(startDate, workStartDateTime)/ minutesInWorkday   // minutes/(minutes/workday) = workday from unit math
    }

    // Oposite logic when moving forward in time
    if (isBefore(startDate, workStartDateTime)){
        return 1
    }
    if (isAfter(startDate, workEndDateTime)){
        return 0
    }
    return differenceInMinutes(workEndDateTime, startDate)/ minutesInWorkday   // minutes/(minutes/workday) = workday from unit math
}

// Removes the extra work that came as a result of ceiling the increment.
const removeOverWork = (workDoneDateTimeWithOverwork: Date, overWork: number, workDayStart: WorkDaySchedule, workDayStop: WorkDaySchedule , timeDirection: TimeDirection) => {
    const workStartDateTime = new Date(Date.UTC(workDoneDateTimeWithOverwork.getUTCFullYear(), workDoneDateTimeWithOverwork.getUTCMonth(), workDoneDateTimeWithOverwork.getUTCDate(), workDayStart.hours, workDayStart.minutes))
    const workEndDateTime = new Date(Date.UTC(workDoneDateTimeWithOverwork.getUTCFullYear(), workDoneDateTimeWithOverwork.getUTCMonth(), workDoneDateTimeWithOverwork.getUTCDate(), workDayEnd.hours, workDayEnd.minutes))
    const minutesInWorkday =  differenceInMinutes(workEndDateTime,workStartDateTime)

    if (timeDirection == TimeDirection.Forward) {
        // Substract the overwork from the end of the day
        return subMinutes(workEndDateTime, overWork * minutesInWorkday)
    }

    // When going backwards overwork means that we have gone too far back in time
    // We must therefore add the overwork minutes to the start of the workday. This means that
    // we go towards the startDate (which is forward in time) and the absolute number of working days
    // goes down
    return addMinutes(workStartDateTime, overWork * minutesInWorkday)
}

//-------------------------------------------------------------------------------------------

/// -----------------------WORKFLOW ---------------------------------------------------------

// Parsing and validating external input. Validation is ommitted here for brevity
const startDate = parseStartDate(unparsedDate, commandLineInput.WorkdayStart, commandLineInput.WorkdayStop)
const workDayStart = parseWorkdaySchedule(commandLineInput.WorkdayStart)
const workDayEnd = parseWorkdaySchedule(commandLineInput.WorkdayStop)
const holidays = parseHolidays(commandLineInput.Holidays)
const recurringHolidays = parseRecurringHolidays(commandLineInput.RecurringHolidays)

const workDays = Math.abs(commandLineInput.Increment)
const timeDirection = commandLineInput.Increment >0? TimeDirection.Forward: TimeDirection.Backward

const workDoneOnStartDay = getWorkDoneOnStartDay(workDayStart, workDayEnd, startDate, timeDirection, holidays, recurringHolidays)
const workDaysLeft = workDays - workDoneOnStartDay

// The startDate is already accountet for as it is a special case so start the recursive function from the next day
const nextDay = timeDirection === TimeDirection.Forward? addDays(startDate, 1): addDays(startDate, -1)

// By rounding up we add an extra day.  The benefit is that we need only to check  whether it's a workday once.
// Naturally, we must remove this "overwork" afterwards
const workDaysLeftRoundedUp = Math.ceil(workDaysLeft)
const lastWorkdayWithOverwork = getLastWorkday(nextDay, workDaysLeftRoundedUp, timeDirection, holidays, recurringHolidays)

// Remove the overwork from the rounding
const overWork = workDaysLeftRoundedUp - workDaysLeft
const lastWorkday = removeOverWork(lastWorkdayWithOverwork, overWork, workDayStart, workDayEnd, timeDirection)
console.log(lastWorkday.toUTCString())