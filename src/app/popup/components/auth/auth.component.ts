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
   

    /* get data on mounted */
    ngOnInit(): void {}
    
    /* login button click handler */
    handleLogin() {
        this.toggleLogin.emit(true)
    }

    /* signUp button click handler */
    handleSignup() {
        this.toggleSignup.emit(true)
    }
}