import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ChromeStorageService {
    private chromeStorage = chrome.storage.local;

    constructor() { }

    /* set data from chrome local storage */
    setStorageData(dataObject: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.chromeStorage.set(dataObject, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    /* get data from chrome local storage */
    getStorageData(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.chromeStorage.get((data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });
    }

    /* chrome storage data */
    resetOnStopTimer() {
        this.setStorageData({ running_time: false });
        this.setStorageData({ timer_start_time: '' });
        this.setStorageData({ select_workType_value: '' });
        this.setStorageData({ select_project_value: '' });
        this.setStorageData({ select_task_value: '' });
    }
}