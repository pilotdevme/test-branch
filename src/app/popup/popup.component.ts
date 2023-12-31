import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './components/auth/auth.component';
import { TimerComponent } from './components/timer/timer.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { ChromeStorageService } from 'src/app/services/chromeService.service';
import { ApiService } from 'src/app/services/api.service';
import { IGetToken } from 'src/app/common/common.interface';

@Component({
    standalone: true,
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: [LoginComponent, TimerComponent, NgIf, NgTemplateOutlet],
    providers: [ApiService],
})
export class PopupComponent implements AfterViewInit {
    public isLoggedIn: boolean = false;
    public isLoading: boolean = true;
    private redirectUri = '';

    constructor(private apiService: ApiService, private chromeService: ChromeStorageService, private changeDetectorRef: ChangeDetectorRef) { }
    /* login button click listener */
    toggleLogin() {
        //open awork login page
        chrome.runtime.sendMessage({ action: 'login-init' , clientId : `${environment.awork.clientId}` , url: `${environment.awork.url}`  })
    }

    fetchAccessToken(authorizationCode: string) {
        const body = {
            "grant_type": 'authorization_code',
            "code": authorizationCode,
            "client_id": `${environment.awork.clientId}`,
            "redirect_uri": `${this.redirectUri}`
        };

        this.apiService.getToken(body).subscribe((response: IGetToken) => {
            if (response.access_token) {
                this.isLoggedIn = true;
                this.isLoading = false;
                this.chromeService.setStorageData({ token: `${response.access_token}` })
                this.chromeService.setStorageData({ authorizationCode: '' })
                this.changeDetectorRef.detectChanges()
            }
        }, (error) => {
            this.isLoading = false;
        });
    }

    /* signUp button click listener */
    toggleSignup(value: boolean | string) {
        //temporarily just logging in.
        // this.isLoggedIn = true
    }

    /* signUp button click listener */
    handleLogout(value: boolean | string) {
        //temporarily just logging in.
        this.isLoggedIn = false;
        this.changeDetectorRef.detectChanges()
    }

    ngAfterViewInit(): void {
        this.redirectUri = chrome.identity.getRedirectURL();
        this.fetchToken();
        this.chromeListener();
    }

    /* fetch token from local storage  */
    async fetchToken() {
        const data: { token: string, authorizationCode: string } = await this.chromeService.getStorageData();
        if (data?.token) {
            this.isLoggedIn = true;
            this.isLoading = false;
        }
        else if (data?.authorizationCode) {
            this.fetchAccessToken(data?.authorizationCode)
        }
        else {
            this.isLoading = false;
        }
    }

    chromeListener(){
        chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
            switch (request.action) {
                case 'loggedIn': {
                    this.fetchToken()
                }
            }
        })
    }
}
