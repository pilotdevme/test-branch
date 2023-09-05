import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PopupService } from '../../../services/popup.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import moment from "moment";
import { interval, Subscription } from 'rxjs';
import { ISelectedValues, IList, ITime, ITimeDifference, ITimeEntry, ILocalData, IProject, IWorkType, ITask } from './timer.interface';
import { enumChangeList, enumList, enumTime, enumTimeDifference, initialTimerValue } from './timer.enum';
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
    public timer: string = initialTimerValue;

    private intervalSubscription !: Subscription;
    private timeDifference: ITimeDifference = enumTimeDifference;
    private getLocData: ILocalData = {};
    private time: ITime = enumTime;


    constructor(private popupService: PopupService, private chrome_service: ChromeStorageService) { }

    /* get project details and timer */
    getTimers() {
        try {
            this.popupService.getTimeEntries().subscribe((response: ITimeEntry[]) => {
                this.timeEntries = response;
            });
        }
        catch (e) { }
    }

    /* start time interval function */
    startTimer() {
        const body = {
            "isBillable": this.selectedValues.isBillable,
            "isBilled": false,
            "taskId": this.selectedValues.task,
            "projectId": this.selectedValues.project,
            "note": this.note,
            "typeOfWorkId": this.selectedValues.typeOfWork,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.popupService.startTimeEntry(body).subscribe((response: ITimeEntry) => {
            this.timerRunning = true
            this.chrome_service.setStorageData({ running_time: this.timerRunning });
            this.chrome_service.setStorageData({ timer_start_time: response?.startTimeLocal });
            if (response) {
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
        });
    }

    /*stop time interval function*/
    stopTimer() {
        this.popupService.endTimeEntry().subscribe(() => {
            this.timerRunning = false;
            this.chrome_service.setStorageData({ running_time: this.timerRunning });
            this.chrome_service.setStorageData({ timer_start_time: ' ' });
            this.chrome_service.setStorageData({ select_workType_value: ' ' });
            this.chrome_service.setStorageData({ select_project_value: ' ' });
            this.chrome_service.setStorageData({ select_task_value: ' ' });

            if (this.timerRunning === false) {
                this.intervalSubscription.unsubscribe();
                this.timer = initialTimerValue;
                this.time = enumTime;
                this.selectedValues = enumChangeList;
            }
        });
        this.getTimers()
    }

    /* get work types */
    getWorkTypes() {
        this.popupService.getTypeOfWork().subscribe((response: IWorkType[]) => {
            this.list.workTypes = response
        });
    }

    /* get projects list */
    getProjects() {
        this.popupService.getProjects().subscribe((response: IProject[]) => {
            this.list.projects = response;
            const dropdownOptions = this.list.projects.map(project => ({ value: project.id, label: project.name, icon: "bell" }))

            // cannot use Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for the types
            const dropdown: any = document.querySelector('#projectsDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions
            }
        });
    }

    /* get task lists according to projects list */
    getTasks() {
        this.popupService.getTasks(this.selectedValues.project).subscribe((response: ITask[]) => {
            this.list.tasks = response
            const dropdownOptions = this.list.tasks.map(task => ({ value: task.id, label: task.name, icon: "bell" }))

            // cannot use Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for these types
            const dropdown: any = document.querySelector('#tasksDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions
            }
        });
    }

    /* current time note */
    noteChange(event: Event) {
        this.note = (event.target as HTMLInputElement)?.value
    }

    /* project list change data */
    projectChange(event: Event) {
        this.selectedValues.project = (event.target as HTMLInputElement)?.value;
        this.chrome_service.setStorageData({ select_project_value: this.selectedValues.project });
        this.selectedValues.isBillable = this.list.projects?.find((project: IProject) => project.id == this.selectedValues.project)?.isBillableByDefault || false
        this.getTasks()
    }

    /* task list change */
    taskChange(event: Event) {
        this.selectedValues.task = (event.target as HTMLInputElement)?.value;
        this.chrome_service.setStorageData({ select_task_value: this.selectedValues.task });
    }

    /* work type list change data */
    typeOfWorkChange(event: Event) {
        this.selectedValues.typeOfWork = (event.target as HTMLInputElement)?.value;
        this.chrome_service.setStorageData({ select_workType_value: this.selectedValues.typeOfWork });
    }

    /* get Date format for project tabel entry */
    getDate(date: string) {
        const formatted_date = moment(date).format("DD MMMM");
        return formatted_date;
    }

    /* get Time format for project tabel entry */
    getTime(time: string) {
        const formatted_time = time?.substring(0, 5)
        return formatted_time;
    }

    /* get start running interval time to end running interval time */
    totalTrackingTime(time: ITimeEntry) {
        /*Given time values as strings*/
        const { startTimeLocal, endTimeLocal } = time;
        return this.timeDifferenceInterval(startTimeLocal, endTimeLocal)
    }

    /* calculate time difference between start running time interval to end running time interval */
    timeDifferenceInterval(startTimeIntervalValue: string, endTimeIntervalValue: string) {

        /*Convert time values to Date objects*/
        const start_loc_time: number = new Date(`1970-01-01T${startTimeIntervalValue}Z`).getTime();
        const end_loc_time: number = new Date(`1970-01-01T${endTimeIntervalValue}Z`).getTime();

        const timeDifference = Math.abs(start_loc_time - end_loc_time);

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
        const timer_timer_start_time = this.getLocData?.timer_start_time?.toString() || "0"; // Replace with your start time
        const timer_end_time: string = formattedDateTime; // Replace with your end time

        return this.timeDifferenceInterval(timer_timer_start_time, timer_end_time);
    }

    /*timer counted function*/
    private updateTimer(): void {
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
        this.timerRunning = this.getLocData?.running_time ?? false

        /* selected project value */
        if (this.selectedValues.project == '') {
            this.selectedValues.project = this.getLocData?.select_project_value ?? '';
        }

        /* selected task value */
        if (this.selectedValues.task == '') {
            this.selectedValues.task = this.getLocData?.select_task_value ?? '';
        }

        /* selected work type value */
        if (this.selectedValues.typeOfWork == '') {
            this.selectedValues.typeOfWork = this.getLocData?.select_workType_value ?? '';
        }

        /* set current timer running time hours, minutes and seconds and call time interval again according to current running time */
        if (this.getLocData?.timer_start_time) {
            this.getTrackingTime()
            if (this.timerRunning == true) {
                this.time.hours = this.timeDifference.hour;
                this.time.minutes = this.timeDifference.minute;
                this.time.seconds = this.timeDifference.second;
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
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
