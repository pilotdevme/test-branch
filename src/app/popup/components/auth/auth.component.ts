import { Component, OnInit, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
@Component({
    standalone: true,
    selector: 'popup-login',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit {
    @Input() login: boolean = false;
    @Output() toggleLogin = new EventEmitter();
    @Output() toggleSignup = new EventEmitter();

    ngOnInit(): void {
        console.log("input", this.login);
    }

    handleLogin() {
        this.toggleLogin.emit(true)
    }

    handleSignup() {
        this.toggleSignup.emit(true)
    }
}