import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './components/auth/auth.component';
import { TimerComponent } from './components/timer/timer.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { ChromeStorageService } from '../services/chromeService.service';
import { PopupService } from '../services/popup.service';
import { IGetToken } from './components/timer/timer.interface';

@Component({
    standalone: true,
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: [LoginComponent, TimerComponent, NgIf, NgTemplateOutlet],
    providers: [PopupService],
})
export class PopupComponent implements AfterViewInit {
    public isLoggedIn: boolean = false;

    constructor(private popupService: PopupService, private chrome_service: ChromeStorageService, private changeDetectorRef: ChangeDetectorRef) { }

    /* login button click listener */
    toggleLogin(value: boolean | string) {

        //open awork login page in new tab
        var redirectUri = chrome.identity.getRedirectURL();

        //redirect url
        var auth_url = `${environment.awork.url}/accounts/authorize?client_id=${environment.awork.clientId}&redirect_uri=${redirectUri}&scope=${environment.awork.scope}&response_type=code&grant_type=authorization_code`;

        chrome.identity.launchWebAuthFlow({ url: auth_url, interactive: true }, (redirect_Url) => {

            if (chrome.runtime.lastError || !redirect_Url) {
                console.error('Authorization failed:', chrome.runtime.lastError);
                return;
            } else if (!redirect_Url) {
                return console.error('Authorization failed: Redirect URL is empty');
            }

            //get authroization code from redirect url
            const url = new URL(redirect_Url);
            const authorizationCode = url.searchParams.get('code');

            if (authorizationCode) {
                //access token api 
                const body = {
                    "grant_type": 'authorization_code',
                    "code": authorizationCode,
                    "client_id": `${environment.awork.clientId}`,
                    "redirect_uri": `${redirectUri}`
                };

                this.popupService.getToken(body).subscribe((response: IGetToken) => {
                    if (response.access_token) {
                        this.isLoggedIn = true
                        this.chrome_service.setStorageData({ token: `${response.access_token}` })
                        this.changeDetectorRef.detectChanges()
                        // this.popupService.setHeader({ token: response.access_token })
                    }
                });
            }
        });

        // chrome.tabs.create({ url: auth_url })
        // save token in extension local storage
        // this.chrome_service.setStorageData({ token: `${environment.awork.token}` })
        // this.isLoggedIn = true;
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
        let data: { token: string } = await this.chrome_service.getStorageData();

        if (data?.token) {
            this.isLoggedIn = true
        }
    }
}
