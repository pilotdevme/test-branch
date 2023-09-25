import { Injectable } from '@angular/core';
import moment from 'moment';
import { ITimeEntry } from '../common/common.interface';

@Injectable({
    providedIn: 'root'
})
export class CommonService {
    constructor() { }
    public timeEntries: ITimeEntry[] = [];

    /* calculate time, hours mintues and seconds */
    calculateTimeDifference(time: number) {
        const hour = Math.floor(time / 3600000); // 1 hour = 3600000 milliseconds
        const minute = Math.floor((time % 3600000) / 60000); // 1 minute = 60000 milliseconds
        const second = Math.floor(((time % 60000) / 1000)); // 1 second = 1000 milliseconds
        return {
            hour,
            minute,
            second
        }
    }
    
    /* date object is used to calculate the time difference
       to get the dates  used '1970-01-01' as constant date with dynamic time values    
    */
    getDateValues(start: string, end: string) {
        const start_loc_time: number = new Date(`1970-01-01T${start}Z`).getTime();
        const end_loc_time: number = new Date(`1970-01-01T${end}Z`).getTime();

        return { start_loc_time, end_loc_time }
    }

     /* date object is used to calculate the time difference
        to get the dates  used '2000-01-01' as constant date with dynamic time values    
     */

     getDateFormat(startTime: string, endTime: string) {
         // Convert time strings to Date objects
         const startDate : any = new Date(`2000-01-01T${startTime}`);
         const endDate : any = new Date(`2000-01-01T${endTime}`);

        return { startDate, endDate }
    }

    /* calculate today's tracking time limit not exceeds more than 10 hours */
    getCalculateTrackingTime(response:any) {
        const currentDate = moment().format('YYYY-MM-DD'); //today's current get for getting today time entries only

         /* Filter timeEntries from total timeEntries to get only today's entries */
         const todayEntries = response.filter((entry: ITimeEntry) => {

            /* Extract the date part from startDateLocal and endDateLocal (e.g., "2023-09-13") */
            const startDate = entry.startDateLocal?.split('T')[0];
            const endDate = entry.endDateLocal?.split('T')[0];

            /* Check if either the start date or end date matches today's currentDate date */
            return startDate === currentDate || endDate === currentDate;
        });


        /* Initialize variables for total hours, minutes, and seconds */
        let totalHours = 0;
        let totalMinutes = 0;
        let totalSeconds = 0;

        /* Calculate the time difference for each today's time entries */
        todayEntries.forEach((entry:any, index:any) => {
            if (entry.startTimeLocal && entry.endTimeLocal) {
                const calculatedTime = this.TotalTimeDifference(entry.startTimeLocal, entry.endTimeLocal);

                /* Add the hours, minutes, and seconds of the current entry to the totals */
                totalHours += calculatedTime.hour;
                totalMinutes += calculatedTime.minute;
                totalSeconds += calculatedTime.second;
            }
        });

        /* Calculate total minutes and seconds from the accumulated seconds */
        totalMinutes += Math.floor(totalSeconds / 60);
        totalSeconds %= 60;

        /* Calculate total hours and minutes from the accumulated minutes */
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
        
        /* 10 hours limit convert in miliiseconds */
        const TotalMilliseconds = 10 * 60 * 60 * 1000;
        const TrackingMilliseconds = Math.max(0, ((totalHours * 3600 + totalMinutes * 60 + totalSeconds) * 1000));

        const calculatedData = TotalMilliseconds - TrackingMilliseconds;
        return  calculatedData
    }

    /*Function to calculate the time difference between start and end times for today entries only*/
    TotalTimeDifference(startTime: any, endTime: any) {
        const { startDate, endDate } = this.getDateFormat(startTime, endTime);
        const timeDiff = endDate - startDate;
        const calculatedTime = this.calculateTimeDifference(timeDiff);
        return calculatedTime;
    }

    /* format time string value */
    formatTime(timeValue: number): string {
        /* add zero as prefix if there single digit in time
            example: converting '9' to '09'
        */
        return timeValue.toString().padStart(2, '0');
    }
}
