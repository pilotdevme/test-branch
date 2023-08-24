import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { PopupService } from '../../popup.service';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import moment from "moment";
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { interval } from 'rxjs';
import { FormsModule } from '@angular/forms';


@Component({
    standalone: true,
    selector: 'timer-login',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgFor, NgIf, HttpClientModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressBarModule, FormsModule, NgTemplateOutlet],
    providers: [PopupService],
})


export class TimerComponent implements OnInit {
    public listWorkTypes: any = [];
    public listProjects: any = [];
    public listTasks: any = [];
    public timeEntries: any = [];
    public note: string = '';
    public timerRunning: boolean = false;
    public typeOfWork: string = '';
    public project: string = '';
    public isBillable: boolean = false;
    public task: string = '';
    public timer: string = '00:00:00';
    public hours: number = 0;
    public minutes: number = 0;
    public seconds: number = 0;
    public interval_subscription: any = '';
    
    private getLocData: any = '';

    constructor(private popup_service: PopupService) { }

    getTimers() {
        try {
            this.popup_service.getTimeEntries().subscribe((response: any) => {
                this.timeEntries = response.slice(0, 4);
            });
        }
        catch (e) { }
    }

    callApi() {
        this.getTimers()
    }


    /*stop time interval function*/
    stopTimer() {
        this.popup_service.endTimeEntry().subscribe((response: any) => {
            this.timerRunning = false;
            chrome.storage.local.set({ running_time: this.timerRunning });
            chrome.storage.local.set({ start_time: ' ' });
            chrome.storage.local.set({ select_workType_value: ' ' });
            chrome.storage.local.set({ select_project_value: ' ' });
            chrome.storage.local.set({ select_task_value: ' ' });

            if (this.timerRunning === false) {
                this.interval_subscription.unsubscribe();
                this.timer = '00.00.00';
                this.hours = 0
                this.seconds = 0
                this.minutes = 0
                this.project = ''
                this.task = ''
                this.typeOfWork = ''
            }
        });
    }

    /*start time interval function*/
    startTimer() {
        let body = {
            "isBillable": this.isBillable,
            "isBilled": false,
            "taskId": this.task,
            "projectId": this.project,
            "note": this.note,
            "typeOfWorkId": this.typeOfWork,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.popup_service.startTimeEntry(body).subscribe((response: any) => {
            this.timerRunning = true
            chrome.storage.local.set({ running_time: this.timerRunning });
            chrome.storage.local.set({ start_time: response?.startTimeLocal });
            if (response) {
                this.interval_subscription = interval(1000).subscribe(() => this.updateTimer());
            }
        });
    }

    /*get work types*/
    getWorkTypes() {
        this.popup_service.getTypeOfWork().subscribe((response: any) => {
            this.listWorkTypes = response
        });
    }

    /*get projects list*/
    getProjects() {
        this.popup_service.getProjects().subscribe((response: any) => {
            this.listProjects = response
        });
    }

    /*get task lists according to projects list*/
    getTasks() {
        this.popup_service.getTasks(this.project).subscribe((response: any) => {
            this.listTasks = response
        });
    }

    /*work type list change data*/
    typeOfWorkChange(event: any) {
        this.typeOfWork = event.target.value;
        chrome.storage.local.set({ select_workType_value: this.typeOfWork });
    }

    /*project list change data*/
    projectChange(event: any) {
        this.project = event.target.value;
        chrome.storage.local.set({ select_project_value: this.project });

        this.isBillable = this.listProjects?.find((project: any) => project.id == this.project)?.isBillableByDefault || false
        this.getTasks()
    }

    /*task list change*/
    taskChange(event: any) {
        this.task = event.target.value;
        chrome.storage.local.set({ select_task_value: this.task });
    }
     
    noteChange(event: any) {
        this.note = event.target.value
    }


    /*Date format for project tabel entry*/
    getDate(v: any) {
        let formatted_date = moment(v).format("DD MMMM");
        return formatted_date;
    }

    /*Time format for project tabel entry*/
    getTime(v: string) {
        let formatted_time = v?.substring(0, 5)
        return formatted_time;
    }

    /*differnce between start loc time and end loc time interval*/
    totalRunningTime(v: any) {
        // Given time values as strings
        const start_time_str = v?.startTimeLocal;
        const end_time_str = v?.endTimeLocal;

        // Convert time values to Date objects
        let start_loc_time: any = new Date(`1970-01-01T${start_time_str}Z`);
        let end_loc_time: any = new Date(`1970-01-01T${end_time_str}Z`);

        let timeDifference = Math.abs(start_loc_time - end_loc_time);

        const hoursDifference = Math.floor(timeDifference / 3600000); // 1 hour = 3600000 milliseconds
        const minutesDifference = Math.floor((timeDifference % 3600000) / 60000); // 1 minute = 60000 milliseconds

        return `${hoursDifference}h${minutesDifference}m`
    }

    /*timer counted function*/
    private updateTimer(): void {
        this.seconds++;
        if (this.seconds >= 60) {
            this.seconds = 0;
            this.minutes++;
            if (this.minutes >= 60) {
                this.minutes = 0;
                this.hours++;
            }
        }
        this.timer = `${this.formatTime(this.hours)}:${this.formatTime(this.minutes)}:${this.formatTime(this.seconds)}`;
    }

    private formatTime(timeValue: number): string {
        return timeValue.toString().padStart(2, '0');
    }

    /*difference between start timer interval to current time interval*/
    getRunningTime() {
        const currentDate = new Date();

        // Extract hours, minutes, seconds, and milliseconds
        const hours = this.formatTime(currentDate.getHours());
        const minutes = this.formatTime(currentDate.getMinutes());
        const seconds = this.formatTime(currentDate.getSeconds());
        const milliseconds = currentDate.getMilliseconds();

        const formattedDateTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

        let timer_start_time : any = this.getLocData?.start_time ? this.getLocData?.start_time : ''; // Replace with your start time

        let timer_end_time : any = formattedDateTime;   // Replace with your end time

        // Convert time values to Date objects
        let start_loc_time: any = new Date(`1970-01-01T${timer_start_time}Z`);

        let end_loc_time: any = new Date(`1970-01-01T${timer_end_time}Z`);


        // Calculate the time difference in milliseconds    
        let timeDifference = Math.abs(start_loc_time - end_loc_time);

        // Convert the time difference to hours and minutes
        let hours_diff : any = Math.floor(timeDifference / 3600000); // 1 hour = 3600000 milliseconds

        let min_diff : any = Math.floor((timeDifference % 3600000) / 60000); // 1 minute = 60000 milliseconds

        let sec_diff : any = Math.floor(((timeDifference % 3600000) / 1000)); // 1 second = 1000 milliseconds


        if (this.timerRunning == true) {
            this.hours = hours_diff;
            this.minutes = min_diff;
            this.seconds = sec_diff;
            this.interval_subscription = interval(1000).subscribe(() => this.updateTimer());
        }
    }

    /*fetch data from local storage*/
    async fetchTimeStamp() {
        this.getLocData = await chrome.storage.local.get();

        /* stored time boolean */
        this.timerRunning = this.getLocData?.running_time

        /* selected project value */

        if (this.project == '') {
            let stored_project_value = this.getLocData?.select_project_value;
            this.project = stored_project_value;
        }


        /* selected task value */
        if (this.task == '') {
            let stored_task_value = this.getLocData?.select_task_value;
            this.task = stored_task_value;
        }



        /* selected work type value */
        if (this.typeOfWork == '') {
            let stored_workType_value = this.getLocData?.select_workType_value;
            this.typeOfWork = stored_workType_value;
        }


        if (this.getLocData?.start_time) {
            this.getRunningTime()
        }

        if (this.project) {
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
