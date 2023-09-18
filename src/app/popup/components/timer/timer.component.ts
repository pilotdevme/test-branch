import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import moment from "moment";
import { interval, Observable, Subscription } from 'rxjs';
import { ISelectedValues, IList, ITime, ITimeDifference, ITimeEntry, ILocalData, IProject, IWorkType, ITask, IStartTimeBody } from '../../../common/common.interface';
import { enumChangeList, enumList, enumTime, enumTimeDifference, initialTimerValue } from '../../../common/common.enum';
import { ChromeStorageService } from 'src/app/services/chromeService.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
    standalone: true,
    selector: 'timer-login',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgFor, NgIf, HttpClientModule, MatProgressBarModule, FormsModule, NgTemplateOutlet],
    providers: [ApiService],
})


export class TimerComponent implements OnInit {
    @Output() handleLogout = new EventEmitter();

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


    constructor(private apiService: ApiService,
        private chromeService: ChromeStorageService,
        private changeDetectorRef: ChangeDetectorRef,
        private commonService: CommonService) { }

    /* get project details and timer */
    getTimers() {
        try {
            this.apiService.getTimeEntries()
                .subscribe((response: ITimeEntry[]) => {
                    // if(response.status)
                    this.timeEntries = response;
                    this.changeDetectorRef.detectChanges(); // Manually trigger change detection

                }, (error) => {
                    if (error.status === 401) {
                        this.handleLogout.emit(true);
                        this.chromeService.setStorageData({ token: "" });
                    } else { }
                }
                );
        }
        catch (e) { }
    }

    /* start time interval function */
    startTimer() {
        const [defaultWorkType] = this.list.workTypes
        const body: IStartTimeBody = {
            "isBillable": this.selectedValues.isBillable,
            "isBilled": false,
            "note": this.note,
            "typeOfWorkId": this.selectedValues.typeOfWork.trim() || defaultWorkType.id,
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.selectedValues.task && (body["taskId"] = this.selectedValues.task);
        this.selectedValues.project && (body["projectId"] = this.selectedValues.project);
        this.apiService.startTimeEntry(body).subscribe((response: ITimeEntry) => {
            this.timerRunning = true;

            this.chromeService.setStorageData({ running_time: this.timerRunning });
            this.chromeService.setStorageData({ timer_start_time: response?.startTimeLocal });
            if (response) {
                /*using 1000 ms interval to increment time by 1 second*/
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
            chrome.runtime.sendMessage({ action: 'syncStartTimer' })
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            chrome.runtime.sendMessage({ action: 'timerStart' })

        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        }
        );
    }

    /*stop time interval function*/
    stopTimer() {
        this.apiService.endTimeEntry().subscribe(() => {
            this.timerRunning = false;
            this.chromeService.resetOnStopTimer()
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection

            if (this.timerRunning === false) {
                chrome.runtime.sendMessage({ action: 'syncStopTimer' })
                this.intervalSubscription.unsubscribe();
                this.timer = initialTimerValue;
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                };
                this.selectedValues = enumChangeList;
            }
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            this.getTimers();
            chrome.runtime.sendMessage({ action: 'timerStop' })

        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        }
        );
    }

    /* get work types */
    getWorkTypes() {
        this.apiService.getTypeOfWork().subscribe((response: IWorkType[]) => {
            this.list.workTypes = response;

            const dropdownOptions = this.list.workTypes.map(workType => ({ value: workType.id, label: workType.name, icon: "bell" }))

            // using any; cannot use type Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for the types
            const dropdown: any = document.querySelector('#workTypeDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions
            }

            this.changeDetectorRef.detectChanges()
        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        }
        );
    }

    /* get projects list */
    getProjects() {
        this.apiService.getProjects()
            .subscribe((response: IProject[]) => {
                this.list.projects = response;
                const dropdownOptions = this.list.projects.map(project => ({ value: project.id, label: project.name, icon: "bell" }))

                // using any; cannot use type Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for the types
                const dropdown: any = document.querySelector('#projectsDropdown')
                if (dropdown) {
                    dropdown.options = dropdownOptions
                }

                this.setDefaultProject();
                this.changeDetectorRef.detectChanges()
            },
                (error) => {
                    if (error.status === 401) {
                        this.handleLogout.emit(true);
                        this.chromeService.setStorageData({ token: "" });
                    } else { }
                }
            );
    }

    /* get task lists according to projects list */
    getTasks() {
        this.apiService.getTasks(this.selectedValues.project).subscribe((response: ITask[]) => {
            this.list.tasks = response
            const dropdownOptions = this.list.tasks.map(task => ({ value: task.id, label: task.name, icon: "bell" }))

            // using any; cannot use type  Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for these types
            const dropdown: any = document.querySelector('#tasksDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions
            }
            this.changeDetectorRef.detectChanges()
        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: " " });
            } else { }
        }
        );
    }

    /* set the default project */
    async setDefaultProject() {
        const data = await this.chromeService.getStorageData();
        this.selectedValues.project = data?.defaultProject ?? ''
    }

    /* current time note */
    noteChange(event: Event) {
        this.note = (event.target as HTMLInputElement)?.value
    }

    /* project list change data */
    projectChange(event: Event) {
        this.selectedValues.project = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ select_project_value: this.selectedValues.project });
        this.selectedValues.isBillable = this.list.projects?.find((project: IProject) => project.id == this.selectedValues.project)?.isBillableByDefault || false;
        this.getTasks()
    }

    /* task list change */
    taskChange(event: Event) {
        this.selectedValues.task = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ select_task_value: this.selectedValues.task });
    }

    /* work type list change data */
    typeOfWorkChange(event: Event) {
        this.selectedValues.typeOfWork = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ select_workType_value: this.selectedValues.typeOfWork });
    }

    /* get Date format for project tabel entry */
    getDate(date: string) {
        const formatted_date = moment(date).format("DD MMM");
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

        /*Convert time values to Date objects */
        const { start_loc_time, end_loc_time } = this.commonService.getdateValues(startTimeIntervalValue, endTimeIntervalValue)
        const timeDifference = Math.abs(start_loc_time - end_loc_time);
        this.timeDifference = this.commonService.calculateTimeDifference(timeDifference)

        return `${this.timeDifference.hour}h${this.timeDifference.minute}m`
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
        const timer_start_time = this.getLocData?.timer_start_time?.toString() || "0"; // Replace with your start time
        const timer_end_time: string = formattedDateTime; // Replace with your end time
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
        return this.timeDifferenceInterval(timer_start_time, timer_end_time);
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
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
        this.timer = `${this.formatTime(this.time.hours)}:${this.formatTime(this.time.minutes)}:${this.formatTime(this.time.seconds)}`;
    }

    /* format time string value */
    private formatTime(timeValue: number): string {
        /* add zero as prefix if there single digit in time
          example: converting '9' to '09'
        */
        return timeValue.toString().padStart(2, '0');
    }

    /* fetch data from local storage */
    async fetchTimeStamp() {
        this.getLocData = await this.chromeService.getStorageData();

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
                /*using 1000 ms interval to increment time by 1 second*/
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
        }
        else {
            chrome.runtime.sendMessage({ action: 'loggedIn' })
        }

        /* get tasks by the selected project id */
        if (this.selectedValues.project) {
            this.getTasks();
        }
    }

    async loadAllData() {
        await this.chromeService.getStorageData();
        this.getTimers();
        this.getProjects();
        this.getWorkTypes();
        this.fetchTimeStamp();
    }

    /*on mounted function*/
    ngOnInit(): void {
        this.loadAllData();
        this.listenEvents();
    }

    /* chrome running listeners */
    openSettings() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    }

    openDashboard(){
        chrome.tabs.create({url: 'https://awork.com'});
    }

    listenEvents() {
        chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
            switch (request.action) {
                case 'stopTimerAPI':
                    this.stopTimer()
                    break;
                default:
                    break;
            }
        })
    }
}
