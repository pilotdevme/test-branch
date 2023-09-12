import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation, OnInit, ChangeDetectorRef} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { interval, Subscription } from 'rxjs';
import { ChromeStorageService } from '../services/chromeService.service';
import { NgIf } from '@angular/common';
import { initialTimerValue, enumTimeDifference, enumTime } from '../common/common.enum';
import { ITimeEntry, ITimeDifference, ILocalData, ITime, IWorkType } from '../common/common.interface';
import { CommonService } from '../services/common.service';
import { IUserContactInfo } from '../common/common.interface';

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
    constructor(private apiService: ApiService,
        private chromeService: ChromeStorageService,
        private changeDetectorRef: ChangeDetectorRef,
        private commonService: CommonService) { }

    public workTypes: IWorkType[] = [];
    public timer: string = initialTimerValue;
    public timeEntries: ITimeEntry[] = [];
    public timerRunning: boolean = false;
    private timeDifference: ITimeDifference = enumTimeDifference;
    private getLocData: ILocalData = {};
    private time: ITime = enumTime;
    private intervalSubscription !: Subscription;


    /* get work types */
    getWorkTypes() {
        this.apiService.getTypeOfWork().subscribe((response: IWorkType[]) => {
            this.workTypes = response;
        },(error) => {
            if (error.status === 401) {               
              // Handle the 401 Unauthorized error here
              console.error('Unauthorized. Redirecting to login page or showing an error message.');
              this.chromeService.setStorageData({token: ""})
              window.location.reload();
            } else {
              // Handle other errors
              console.error('An error occurred:', error);
            }
          }
        );
    }

    /* start time interval function */
    startTimer() {
        const [deafaultWorkType] = this.workTypes;
        const body = {
            "typeOfWorkId": deafaultWorkType.id ?? '',
            "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        this.apiService.startTimeEntry(body).subscribe((response: ITimeEntry) => {
            this.timerRunning = true;
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
            this.chromeService.setStorageData({ running_time: this.timerRunning });
            this.chromeService.setStorageData({ timer_start_time: response?.startTimeLocal });
            if (response) {
                this.time = {
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                };
                /*using 1000 ms interval to increment time by 1 second*/ 
                this.intervalSubscription = interval(1000).subscribe(() => this.updateTimer());
            }
        },(error) => {
            if (error.status === 401) {               
              // Handle the 401 Unauthorized error here
              console.error('Unauthorized. Redirecting to login page or showing an error message.');
              this.chromeService.setStorageData({ token: "" });
              window.location.reload();
            } else {
              // Handle other errors
              console.error('An error occurred:', error);
            }
          }
        );
        chrome.runtime.sendMessage('timerStart')
    }

    /*stop time interval function*/
    stopTimer() {
        this.apiService.endTimeEntry().subscribe(() => {
            this.timerRunning = false;
            this.changeDetectorRef.detectChanges(); // Manually trigger change detection
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
        },(error) => {
            if (error.status === 401) {               
              // Handle the 401 Unauthorized error here
              console.error('Unauthorized. Redirecting to login page or showing an error message.');
              this.chromeService.setStorageData({ token: "" });
              window.location.reload();
            } else {
              // Handle other errors
              console.error('An error occurred:', error);
            }
          }
        );
        chrome.runtime.sendMessage('timerStop')
    }

    /* format time string value */
    private formatTime(timeValue: number): string {
        /* add zero as prefix if there single digit in time
          example: converting '9' to '09'
        */
        return timeValue.toString().padStart(2, '0');
    }

    /* calculate time difference between start running time interval to end running time interval */
    timeDifferenceInterval(startTimeIntervalValue: string, endTimeIntervalValue: string) {

        /*Convert time values to Date objects */
        const { start_loc_time, end_loc_time } = this.commonService.getdateValues(startTimeIntervalValue, endTimeIntervalValue)
        const timeDifference = Math.abs(start_loc_time - end_loc_time);
        this.timeDifference = this.commonService.calculateTimeDifference(timeDifference)

        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
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
        this.timer = `${this.formatTime(this.time.hours)}:${this.formatTime(this.time.minutes)}:${this.formatTime(this.time.seconds)}`;
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
    }


    /* fetch data from local storage */
    async fetchTimeStamp() {
        this.getLocData = await this.chromeService.getStorageData();

        /* stored time boolean */
        this.timerRunning = this.getLocData?.running_time ?? false

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
    }

    /* get loggedIn user */
    getLoggedInUser() {
        this.apiService.getLoggedInUser().subscribe((response: IUserContactInfo) => {}
        ,(error) => {
            if (error.status === 401) {               
              // Handle the 401 Unauthorized error here
              this.chromeService.setStorageData({ token: "" });
              chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                chrome.tabs.reload(tabs[0].id || 0);
              });
            } else {
              // Handle other errors
              console.error('An error occurred:', error);
            }
          }
        );
    }


    async ngOnInit(): Promise<void> {
        this.getLocData = await this.chromeService.getStorageData();
        this.getLoggedInUser();
        this.getWorkTypes();

        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            let url: string = tabs[0].url || "";
            this.chromeService.setStorageData({ url: url });
            if (this.getLocData?.token) {
                this.content = url;
            }
        });


        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

            // Check if the message has the data you're expecting
            switch (request) {
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

                default:
                    break;
                
            }
        });

        this.fetchTimeStamp();
    }
}
