import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CommonService {

    constructor() { }

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
    getdateValues(start: string, end: string) {
        const start_loc_time: number = new Date(`1970-01-01T${start}Z`).getTime();
        const end_loc_time: number = new Date(`1970-01-01T${end}Z`).getTime();

        return { start_loc_time, end_loc_time }
    }
}
