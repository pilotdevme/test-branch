import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import moment from "moment";
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChromeStorageService } from 'src/app/services/chromeService.service';
import { CommonService } from 'src/app/services/common.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ISelectedValues, IList, ITime, ITimeDifference, ITimeEntry, ILocalData, IProject, IWorkType, ITask, IStartTimeBody, ITimeTrackingSetting } from 'src/app/common/common.interface';
import { enumChangeList, enumList, enumTime, enumTimeDifference, initialTimerValue, enumProjectDetail, enumTimeTrackingSetting } from 'src/app/common/common.enum';

@Component({
    standalone: true,
    selector: 'timer-login',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgFor, NgIf, HttpClientModule, MatProgressBarModule, FormsModule, NgTemplateOutlet, TranslateModule],
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
    public isButtonDisabled: boolean = false;

    private intervalSubscription !: Subscription;
    private timeDifference: ITimeDifference = enumTimeDifference;
    private getLocData: ILocalData = {};
    private time: ITime = enumTime;
    private calculatedData: number = 0;
    private defaultProject: string = '';
    private timeTrackingSetting : ITimeTrackingSetting = enumTimeTrackingSetting;
    
    constructor(
        private apiService: ApiService,
        private chromeService: ChromeStorageService,
        private changeDetectorRef: ChangeDetectorRef,
        private commonService: CommonService,
        private translate: TranslateService
    ) {
        translate.setDefaultLang('en');
        translate.use('en');
    }

    /*get time entries*/
    getTimers() {
        try {
            this.apiService.getTimeEntries().subscribe((response: ITimeEntry[]) => {
                this.timeEntries = response.slice(0, 4);
                this.calculatedData = this.commonService.getCalculateTrackingTime(response);
                this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            }, (error) => {
                if (error.status === 401) {
                    this.handleLogout.emit(true);
                    this.chromeService.setStorageData({ token: "" });
                } else { }
            });
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
                /* using 1000 ms interval to increment time by 1 second */
                this.intervalSubscription = interval(1000).subscribe(() => { this.updateTimer(); });
            }
            chrome.runtime.sendMessage({ action: 'syncStartTimer' })
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            chrome.runtime.sendMessage({ action: 'timerStart' })
            if(this.timeTrackingSetting.trackingLimit === true){
                chrome.runtime.sendMessage({ action: 'time-tracking-limit', data: this.calculatedData })
            }

        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        });
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
            }
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            this.getTimers();
            chrome.runtime.sendMessage({ action: 'timerStop' })
        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        });
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
                dropdown.value = this.selectedValues?.typeOfWork
            }
            this.changeDetectorRef.detectChanges();
        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        });
    }

 /* get time tracking setting */
    getTimeTrackingSetting() {
        this.apiService.timeTrackingSettings().subscribe((response: any) => { 
        response.forEach((setting:any) => {
            if(setting.type === "prevent-on-done-projects"){
                this.timeTrackingSetting.preventDoneProjects = setting.enabled;
            }
            if(setting.type === "time-tracking-limit"){
                this.timeTrackingSetting.trackingLimit = setting.enabled;
            }
            if(setting.type === "prevent-private"){
                this.timeTrackingSetting.preventPrivate = setting.enabled;
            }
        });
        }, (error) => {
            if (error.status === 401) {
                this.handleLogout.emit(true);
                this.chromeService.setStorageData({ token: "" });
            } else { }
        });
    }

    /* get projects list */
    getProjects() {
        this.apiService.getProjects()
            .subscribe((response: IProject[]) => {
                console.log(response,"projects");
                
                this.list.projects = response;
                const dropdownOptions = this.list.projects.map(project => ({
                    value: project.id,
                    label: project.name,
                    icon: "bell"
                }));
                const defaultProjectStatus = this.list.projects.find((v)=> v.id === this.defaultProject)  ?? enumProjectDetail ;
                if(defaultProjectStatus.projectStatus.type === "closed"){
                    if(this.timeTrackingSetting.preventDoneProjects === true){
                        this.isButtonDisabled = true;
                    }
                    else {
                        this.isButtonDisabled = false;
                    }
                }
                // using any; cannot use type Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for the types
                const dropdown: any = document.querySelector('#projectsDropdown')
                if (dropdown) {
                    dropdown.options = dropdownOptions
                    dropdown.value = this.selectedValues.project ? this.selectedValues.project : this.defaultProject;
                }
                this.changeDetectorRef.detectChanges()
            },
            (error) => {
                if (error.status === 401) {
                    this.handleLogout.emit(true);
                    this.chromeService.setStorageData({ token: "" });
                } else { }
            });
    }

    /* get task lists according to projects list */
    getTasks() {
        const projectId = this.selectedValues.project ? this.selectedValues.project : this.defaultProject
        this.apiService.getTasks(projectId).subscribe((response: ITask[]) => {
            this.list.tasks = response
            const dropdownOptions = this.list.tasks.map(task => ({ value: task.id, label: task.name, icon: "bell" }))
            // using any; cannot use type  Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for these types
            const dropdown: any = document.querySelector('#tasksDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions;
                dropdown.value = this.selectedValues?.task
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

    /* current time note */
    noteChange(event: Event) {
        this.note = (event.target as HTMLInputElement)?.value;
        this.chromeService.setStorageData({ note: this.note });
    }

    /* project list change data */
    projectChange(event: Event) {
        const selectedProject = (event as CustomEvent).detail?.value;
        if (selectedProject) {
            const projectDetail = this.list.projects.find((v) => v.id === selectedProject) ?? enumProjectDetail;
            /* prevent time tracking on done projects */
            if (projectDetail.projectStatus.type === "closed") {
                this.chromeService.setStorageData({ projectStatus: projectDetail.projectStatus.type });
                if(this.timeTrackingSetting.preventDoneProjects === true){                    
                    this.isButtonDisabled = true;
                }
            } else {
                this.chromeService.setStorageData({ projectStatus: '' });
                this.isButtonDisabled = false;
            }

            /* prevent time tracking on private projects */
            if(this.timeTrackingSetting.preventPrivate === true){                    
                 this.isButtonDisabled = true;               
            } else {
                this.chromeService.setStorageData({ projectStatus: '' });
                this.isButtonDisabled = false;
            }

            this.selectedValues.project = selectedProject;
            this.chromeService.setStorageData({ selectedValues: this.selectedValues });
            this.selectedValues.isBillable = this.list.projects?.find((project: IProject) => project.id == this.selectedValues.project)?.isBillableByDefault || false;
            this.getTasks();
        }
    }

    /* task list change */
    taskChange(event: Event) {
        this.selectedValues.task = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ selectedValues: this.selectedValues });
    }

    /* work type list change data */
    typeOfWorkChange(event: Event) {
        this.selectedValues.typeOfWork = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ selectedValues: this.selectedValues });
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

        /* Convert time values to Date objects */
        const { start_loc_time, end_loc_time } = this.commonService.getDateValues(startTimeIntervalValue, endTimeIntervalValue)
        const timeDifference = Math.abs(start_loc_time - end_loc_time);
        this.timeDifference = this.commonService.calculateTimeDifference(timeDifference)

        return `${this.timeDifference.hour}h${this.timeDifference.minute}`
    }

    /* get start time interval and current running time interval */
    getTrackingTime() {
        const currentDate = new Date();

        /* Extract hours, minutes, seconds, and milliseconds */
        const hours = this.commonService.formatTime(currentDate.getHours());
        const minutes = this.commonService.formatTime(currentDate.getMinutes());
        const seconds = this.commonService.formatTime(currentDate.getSeconds());
        const milliseconds = currentDate.getMilliseconds();

        const formattedDateTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
        const timer_start_time = this.getLocData?.timer_start_time?.toString() || "0"; // Replace with your start time
        const timer_end_time: string = formattedDateTime; // Replace with your end time
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
        return this.timeDifferenceInterval(timer_start_time, timer_end_time);
    }

    /* timer counted function */
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
        this.timer = `${this.commonService.formatTime(this.time.hours)}:${this.commonService.formatTime(this.time.minutes)}:${this.commonService.formatTime(this.time.seconds)}`;
    }

    /* fetch data from local storage */
    async fetchTimeStamp() {
        this.getLocData = await this.chromeService.getStorageData();

        /* stored time boolean */
        this.timerRunning = this.getLocData?.running_time ?? false;
        /* stored note */
        this.note = this.getLocData?.note ?? '';

        this.selectedValues = this.getLocData.selectedValues ?? enumChangeList;      
        this.defaultProject =  this.getLocData?.defaultProject ?? '';

        if (this.defaultProject) {
            this.getTasks();
        }

        /* set current timer running time hours, minutes and seconds and call time interval again according to current running time */
        if (this.getLocData?.timer_start_time) {
            this.getTrackingTime()
            if (this.timerRunning == true) {
                this.time.hours = this.timeDifference.hour;
                this.time.minutes = this.timeDifference.minute;
                this.time.seconds = this.timeDifference.second;
                /* using 1000 ms interval to increment time by 1 second */
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
        this.getTimeTrackingSetting();   
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

    openDashboard() {
        chrome.tabs.create({ url: 'https://awork.com' });
    }

    listenEvents() {
        chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
            switch (request.action) {
                case 'stopTimerAPI':
                    this.stopTimer()
                    break;
                case 'stopTime':
                    this.fetchTimeStamp();
                    this.timerRunning = false;
                    this.timer = initialTimerValue;
                    this.intervalSubscription?.unsubscribe();
                    this.changeDetectorRef.detectChanges(); // Manually trigger change detection
                    break;
                default:
                    break;
            }
        })
    }
}
