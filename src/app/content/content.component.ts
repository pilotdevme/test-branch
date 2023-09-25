import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';
import { interval, Subscription } from 'rxjs';
import { ChromeStorageService } from 'src/app/services/chromeService.service';
import { CommonService } from 'src/app/services/common.service';
import { NgIf } from '@angular/common';
import { environment } from 'src/environments/environment';
import { initialTimerValue, enumTimeDifference, enumTime, enumChangeList, enumTimeTrackingSetting } from 'src/app/common/common.enum';
import { ITimeEntry, ITimeDifference, ILocalData, ITime, IWorkType, IUserContactInfo, ISelectedValues, IStartTimeBody, ITimeTrackingSetting } from 'src/app/common/common.interface';

/*
 * 'ViewEncapsulation.None' is used to set page body margins to 0 for this component.
 * If body margins is set to 0 globally (for example, if bootstrap is used), you can
 * remove this parameter.
*/
@Component({
    standalone: true,
    selector: 'app-content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    encapsulation: ViewEncapsulation.None,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [HttpClientModule, NgIf],
    providers: [ApiService],
})
export class ContentComponent implements OnInit {
    content: string = '';
    constructor(
        private apiService: ApiService,
        private chromeService: ChromeStorageService,
        private changeDetectorRef: ChangeDetectorRef,
        private commonService: CommonService
        ) { }

    public selectedValues: ISelectedValues = enumChangeList;
    public workTypes: IWorkType[] = [];
    public timer: string = initialTimerValue;
    public timeEntries: ITimeEntry[] = [];
    public timerRunning: boolean = false;
    private timeDifference: ITimeDifference = enumTimeDifference;
    private getLocData: ILocalData = {};
    private time: ITime = enumTime;
    private intervalSubscription !: Subscription;
    private calculatedTime: number = 0;
    private timeTrackingSetting: ITimeTrackingSetting = enumTimeTrackingSetting;

    /* get time entries */
    getTimers() {
        try {
            this.apiService.getTimeEntries().subscribe((response: ITimeEntry[]) => {
                this.timeEntries = response.slice(0, 4);
                this.calculatedTime = this.commonService.getCalculateTrackingTime(response);
                this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            }, (error) => {
                if (error.status === 401) {
                    this.chromeService.setStorageData({ token: "" });
                } else { }
            });
        }
        catch (e) { }
    }

    /* get work types */
    getWorkTypes() {
        this.apiService.getTypeOfWork().subscribe((response: IWorkType[]) => {
            this.workTypes = response;
        }, (error) => {
            if (error.status === 401) {
                this.chromeService.setStorageData({ token: "" })
                window.location.reload();
            } else { }
        });
    }

    /* get time tracking setting */
    getTimeTrackingSetting() {
        this.apiService.timeTrackingSettings().subscribe((response: any) => {
            this.timeTrackingSetting = this.commonService.timeTrackingSettingCase(response);
        }, (error) => {
            if (error.status === 401) {
                this.chromeService.setStorageData({ token: "" });
            } else { }
        });
    }

    /* start time interval function */
    startTimer() {
        const [deafaultWorkType] = this.workTypes;
        const body: IStartTimeBody = {
            "isBillable": this.selectedValues.isBillable,
            "isBilled": false,
            "typeOfWorkId": deafaultWorkType?.id ?? '',
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.selectedValues.task && (body["taskId"] = this.selectedValues.task);
        this.selectedValues.project && (body["projectId"] = this.selectedValues.project);
        this.apiService.startTimeEntry(body).subscribe((response: ITimeEntry) => {

            this.timerRunning = true;
            this.chromeService.setStorageData({ running_time: this.timerRunning });
            this.chromeService.setStorageData({ timer_start_time: response?.startTimeLocal });
            if (response) {
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                };
                /* using 1000 ms interval to increment time by 1 second */
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
        }, (error) => {
            if (error.status === 401) {
                this.chromeService.setStorageData({ token: "" });
                window.location.reload();
            } else { }
        });
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection 
        chrome.runtime.sendMessage({ action: 'timerStart' })
        if (this.timeTrackingSetting.trackingLimit === true) {
            chrome.runtime.sendMessage({ action: 'timeTrackingLimit', data: this.calculatedTime, url: `${environment.awork.url}` })
        }
    }

    /* stop time interval function */
    stopTimer() {
        this.apiService.endTimeEntry().subscribe(() => {
            this.timerRunning = false;
            this.chromeService.resetOnStopTimer()

            if (this.timerRunning === false) {
                this.intervalSubscription.unsubscribe();
                this.timer = initialTimerValue;
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                };
            }
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            this.getTimers()
            chrome.runtime.sendMessage({ action: 'timerStop' })
        }, (error) => {
            if (error.status === 401) {
                this.chromeService.setStorageData({ token: "" });
                window.location.reload();
            } else { }
        });
    }

    /* calculate time difference between start running time interval to end running time interval */
    timeDifferenceInterval(startTimeIntervalValue: string, endTimeIntervalValue: string) {

        /* Convert time values to Date objects */
        const { start_loc_time, end_loc_time } = this.commonService.getDateValues(startTimeIntervalValue, endTimeIntervalValue)
        const timeDifference = Math.abs(start_loc_time - end_loc_time);
        this.timeDifference = this.commonService.calculateTimeDifference(timeDifference)

        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
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
        this.timer = `${this.commonService.formatTime(this.time.hours)}:${this.commonService.formatTime(this.time.minutes)}:${this.commonService.formatTime(this.time.seconds)}`;
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
    }


    /* fetch data from local storage */
    async fetchTimeStamp() {
        this.getLocData = await this.chromeService.getStorageData();

        /* stored time boolean */
        this.timerRunning = this.getLocData?.running_time ?? false

        /* set current timer running time hours, minutes and seconds and call time interval again according to current running time */
        if (this.getLocData?.timer_start_time) {
            this.getTrackingTime();
            if (this.timerRunning == true) {
                this.time.hours = this.timeDifference.hour;
                this.time.minutes = this.timeDifference.minute;
                this.time.seconds = this.timeDifference.second;
                /* using 1000 ms interval to increment time by 1 second */
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
        }
    }

    /* get loggedIn user */
    getLoggedInUser() {
        this.apiService.getLoggedInUser().subscribe((response: IUserContactInfo) => { }
            , (error) => {
                if (error.status === 401) {
                    this.chromeService.setStorageData({ token: "" });
                    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                        chrome.tabs.reload(tabs[0]?.id || 0);
                    });
                } else { }
            }
        );
    }

    listenEvents() {
        /* background listerners for timer start or stop from content script */
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'syncStartTimer':
                    this.fetchTimeStamp();
                    this.timer = initialTimerValue;
                    this.timerRunning = true;
                    this.intervalSubscription?.unsubscribe();
                    this.changeDetectorRef.detectChanges(); // Manually trigger change detection
                    break;

                case 'syncStopTimer':
                    this.fetchTimeStamp();
                    this.timerRunning = false;
                    this.timer = initialTimerValue;
                    this.intervalSubscription?.unsubscribe();
                    this.changeDetectorRef.detectChanges(); // Manually trigger change detection
                    break;

                case 'stopTimerAPI':
                    this.fetchTimeStamp();
                    this.timerRunning = false;
                    this.timer = initialTimerValue;
                    this.intervalSubscription?.unsubscribe();
                    this.changeDetectorRef.detectChanges(); // Manually trigger change detection
                    break;
                default:
                    break;
            }
        });
    }

    async ngOnInit(): Promise<void> {
        this.getLocData = await this.chromeService.getStorageData();
        this.selectedValues = this.getLocData.selectedValues ?? enumChangeList;

        this.getTimers;
        this.getTimeTrackingSetting();
        this.getLoggedInUser();
        this.getWorkTypes();

        /* fetch current window, this code can be written for accessing only github url only */
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            let url: string = tabs[0].url || "";
            this.chromeService.setStorageData({ url: url });
            if (this.getLocData?.token) {
                this.content = url;
            }
        });

        this.listenEvents();
        this.fetchTimeStamp();
    }
}
