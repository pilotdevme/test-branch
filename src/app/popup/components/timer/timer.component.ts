import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PopupService } from '../../../services/popup.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import moment from "moment";
import { interval,Subscription } from 'rxjs';
import { ISelectedValues, IList, ITime, ITimeDifference, ITimeEntry } from './timer.interface';
import { enumChangeList, enumList, enumTime, enumTimeDifference } from './timer.enum';
import { ChromeStorageService } from 'src/app/services/chromeService.service';


@Component({
    standalone: true,
    selector: 'timer-login',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgFor, NgIf, HttpClientModule, MatProgressBarModule, FormsModule, NgTemplateOutlet],
    providers: [PopupService],
})


export class TimerComponent implements OnInit {
    public list: IList = enumList;
    public timeEntries: ITimeEntry[] = [];
    public note: string = '';
    public selectedValues: ISelectedValues = enumChangeList;
    public timerRunning: boolean = false;
    public timer: string = '00:00:00';

    private interval_subscription !: Subscription;
    private timeDifference: ITimeDifference = enumTimeDifference;
    private getLocData: any = '';
    private time: ITime = enumTime;


    constructor(private popup_service: PopupService, private chrome_service: ChromeStorageService) { }

    /* get project details and timer */
    getTimers() {
        try {
            this.popup_service.getTimeEntries().subscribe((response: any) => {
                this.timeEntries = response.slice(0, 4);
            });
        }
        catch (e) { }
    }

    /* start time interval function */
    startTimer() {
        let body = {
            "isBillable": this.selectedValues.isBillable,
            "isBilled": false,
            "taskId": this.selectedValues.task,
            "projectId": this.selectedValues.project,
            "note": this.note,
            "typeOfWorkId": this.selectedValues.typeOfWork,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.popup_service.startTimeEntry(body).subscribe((response: any) => {
            this.timerRunning = true
            this.chrome_service.setStorageData({ running_time: this.timerRunning });
            this.chrome_service.setStorageData({ timer_start_time: response?.startTimeLocal });
            if (response) {
                this.interval_subscription = interval(1000).subscribe(() => this.Timer());
            }
        });
    }

    /*stop time interval function*/
    stopTimer() {
        this.popup_service.endTimeEntry().subscribe((response: any) => {
            this.timerRunning = false;
            this.chrome_service.setStorageData({ running_time: this.timerRunning });
            this.chrome_service.setStorageData({ timer_start_time: ' ' });
            this.chrome_service.setStorageData({ select_workType_value: ' ' });
            this.chrome_service.setStorageData({ select_project_value: ' ' });
            this.chrome_service.setStorageData({ select_task_value: ' ' });

            if (this.timerRunning === false) {
                this.interval_subscription.unsubscribe();
                this.timer = '00.00.00';
                this.time.hours = 0;
                this.time.seconds = 0;
                this.time.minutes = 0;
                this.selectedValues.project = '';
                this.selectedValues.task = '';
                this.selectedValues.typeOfWork = '';
            }
        });
        this.getTimers()
    }

    /* get work types */
    getWorkTypes() {
        this.popup_service.getTypeOfWork().subscribe((response: any) => {
            this.list.workTypes = response
        });
    }

    /* get projects list */
    getProjects() {
        this.popup_service.getProjects().subscribe((response: any) => {
            this.list.projects = response
        });
    }

    /* get task lists according to projects list */
    getTasks() {
        this.popup_service.getTasks(this.selectedValues.project).subscribe((response: any) => {
            this.list.tasks = response
        });
    }

    /* current time note */
    noteChange(event: any) {
        this.note = event.target.value
    }

    /* project list change data */
    projectChange(event: any) {
        this.selectedValues.project = event.target.value;
        this.chrome_service.setStorageData({ select_project_value: this.selectedValues.project });
        this.selectedValues.isBillable = this.list.projects?.find((project: any) => project.id == this.selectedValues.project)?.isBillableByDefault || false
        this.getTasks()
    }

    /* task list change */
    taskChange(event: any) {
        this.selectedValues.task = event.target.value;
        this.chrome_service.setStorageData({ select_task_value: this.selectedValues.task });
    }

    /* work type list change data */
    typeOfWorkChange(event: any) {
        this.selectedValues.typeOfWork = event.target.value;
        this.chrome_service.setStorageData({ select_workType_value: this.selectedValues.typeOfWork });
    }

    /* get Date format for project tabel entry */
    getDate(date: any) {
        let formatted_date = moment(date).format("DD MMMM");
        return formatted_date;
    }

    /* get Time format for project tabel entry */
    getTime(time: string) {
        let formatted_time = time?.substring(0, 5)
        return formatted_time;
    }

    /* get start running interval time to end running interval time */
    totalTrackingTime(time: any) {
        /*Given time values as strings*/
        const timer_start_time_interval = time?.startTimeLocal;
        const end_time_interval = time?.endTimeLocal;

        return this.timeDifferenceInterval(timer_start_time_interval, end_time_interval)
    }

    /* calculate time difference between start running time interval to end running time interval */
    timeDifferenceInterval(startTimeIntervalValue: any, endTimeIntervalValue: any) {

        /*Convert time values to Date objects*/
        let start_loc_time: any = new Date(`1970-01-01T${startTimeIntervalValue}Z`);
        let end_loc_time: any = new Date(`1970-01-01T${endTimeIntervalValue}Z`);

        let timeDifference = Math.abs(start_loc_time - end_loc_time);

        this.timeDifference.hour = Math.floor(timeDifference / 3600000); // 1 hour = 3600000 milliseconds
        this.timeDifference.minute = Math.floor((timeDifference % 3600000) / 60000); // 1 minute = 60000 milliseconds
        this.timeDifference.second = Math.floor(((timeDifference % 3600000) / 1000)); // 1 second = 1000 milliseconds

        return `${this.timeDifference.hour}h ${this.timeDifference.minute}m`
    }

    /* get start time interval and current running time interval */
    getTrackingTime() {
        const currentDate = new Date();

        /*Extract hours, minutes, seconds, and milliseconds*/
        const hours = this.formatTime(currentDate.getHours());
        const minutes = this.formatTime(currentDate.getMinutes());
        const seconds = this.formatTime(currentDate.getSeconds());
        const milliseconds = currentDate.getMilliseconds();

        const formattedDateTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

        let timer_timer_start_time: number = this.getLocData?.timer_start_time ? this.getLocData?.timer_start_time : ''; // Replace with your start time
        let timer_end_time: string = formattedDateTime; // Replace with your end time

        return this.timeDifferenceInterval(timer_timer_start_time, timer_end_time);
    }

    /*timer counted function*/
    private Timer(): void {
        this.time.seconds++;
        if (this.time.seconds >= 60) {
            this.time.seconds = 0;
            this.time.minutes++;
            if (this.time.minutes >= 60) {
                this.time.minutes = 0;
                this.time.hours++;
            }
        }
        this.timer = `${this.formatTime(this.time.hours)}:${this.formatTime(this.time.minutes)}:${this.formatTime(this.time.seconds)}`;
    }

    /* format time string value */
    private formatTime(timeValue: number): string {
        return timeValue.toString().padStart(2, '0');
    }

    /* fetch data from local storage */
    async fetchTimeStamp() {
        this.getLocData = await this.chrome_service.getStorageData();

        /* stored time boolean */
        this.timerRunning = this.getLocData?.running_time

        /* selected project value */
        if (this.selectedValues.project == '') {
            let stored_project_value = this.getLocData?.select_project_value;
            this.selectedValues.project = stored_project_value;
        }

        /* selected task value */
        if (this.selectedValues.task == '') {
            let stored_task_value = this.getLocData?.select_task_value;
            this.selectedValues.task = stored_task_value;
        }

        /* selected work type value */
        if (this.selectedValues.typeOfWork == '') {
            let stored_workType_value = this.getLocData?.select_workType_value;
            this.selectedValues.typeOfWork = stored_workType_value;
        }

        /* set current timer running time hours, minutes and seconds and call time interval again according to current running time */
        if (this.getLocData?.timer_start_time) {
            this.getTrackingTime()
            if (this.timerRunning == true) {
                this.time.hours = this.timeDifference.hour;
                this.time.minutes = this.timeDifference.minute;
                this.time.seconds = this.timeDifference.second;
                this.interval_subscription = interval(1000).subscribe(() => this.Timer());
            }
        }

        /* get tasks by the selected project id */
        if (this.selectedValues.project) {
            this.getTasks();
        }
    }

    /*on mounted function*/
    ngOnInit(): void {
        this.getTimers();
        this.getProjects();
        this.getWorkTypes();
        this.fetchTimeStamp()
    }
}
