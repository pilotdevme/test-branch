import { Component, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './components/auth/auth.component';
import { TimerComponent } from './components/timer/timer.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: [LoginComponent, TimerComponent, NgIf, NgTemplateOutlet]
})
export class PopupComponent implements AfterViewInit {
    public login = false;

    toggleLogin(value: any) {
        chrome.tabs.create({ url: `${environment.awork.url}/accounts/authorize?client_id=${environment.awork.clientId}&redirect_uri=${environment.awork.redirectUrl}&scope=${environment.awork.scope}&response_type=code&grant_type=authorization_code` })
        chrome.storage.local.set({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWYzZDk2OC1mZTdmLTRlM2YtYjEzZC0yNWMyODRmZDIzZWQiLCJuYW1lIjoicmF2ZXJtYS5tZUBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJyYXZlcm1hLm1lQGdtYWlsLmNvbSIsImlpZCI6IjExZjNkOTY4LWZlN2YtNGUzZi1iMTNkLTI1YzI4NGZkMjNlZCIsIndpZCI6IjNjOWRiZjRlLWI5ZTQtNDg4NS04ODg5LWNkMzM5NjQ1NjBjYyIsInVpZCI6IjhiMGVlNWE2LTQwZDQtNDA1Ny1hMzE5LWFlMDAzNjA1NzRlNSIsInNjb3BlIjoib2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJhd29yay1leHQiLCJ0b2tlbl91c2FnZSI6ImFjY2Vzc190b2tlbiIsImNmZF9sdmwiOiJwcml2YXRlIiwibmJmIjoxNjkyNzcyMjgwLCJleHAiOjE2OTI4NTg2ODAsImlzcyI6Imh0dHBzOi8vYXBpLmF3b3JrLmlvLyIsImF1ZCI6ImF3b3JrLmlvIn0.-UFxILCmCA6utz71XFtkP3VNrQL_gHkvmId9QwcKYSM' })
        this.login = true;
    }
    toggleSignup(value: any) {
        console.log("login", this.login)
        this.login = true
    }

    ngAfterViewInit(): void {
        this.fetchToken()
    }

    async fetchToken() {
        let data: any = await chrome.storage.local.get();
        if (data?.token) {
            console.log("data", JSON.stringify(data.token))
            this.login = true
            console.log(this.login, "login 1")
        }
    }
}
