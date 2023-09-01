import { Component, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './components/auth/auth.component';
import { TimerComponent } from './components/timer/timer.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { ChromeStorageService } from '../services/chromeService.service';

@Component({
    standalone: true,
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: [LoginComponent, TimerComponent, NgIf, NgTemplateOutlet]
})
export class PopupComponent implements AfterViewInit {
    public isLoggedIn : boolean = false;

    constructor(private chrome_service: ChromeStorageService) { }
    
    /* login button click listener */ 
    toggleLogin(value: boolean | string) {

        //open awork login page in new tab
        chrome.tabs.create({ url: `${environment.awork.url}/accounts/authorize?client_id=${environment.awork.clientId}&redirect_uri=${environment.awork.redirectUrl}&scope=${environment.awork.scope}&response_type=code&grant_type=authorization_code` })

        // save token in extension local storage
        this.chrome_service.setStorageData({ token: `${environment.awork.token}` })
        this.isLoggedIn = true;
    }

    /* signUp button click listener */ 
    toggleSignup(value: boolean | string) {

        //temporarily just logging in.
        this.isLoggedIn = true
    }

    ngAfterViewInit(): void {
        this.fetchToken()
    }

    /* fetch token from local storage  */
    async fetchToken() {
        let data: {token: string}  = await this.chrome_service.getStorageData();

        if (data?.token) {
            this.isLoggedIn = true
        }
    }
}
