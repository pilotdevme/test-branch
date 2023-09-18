import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
@Component({
    standalone: true,
    selector: 'popup-login',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [TranslateModule]
})
export class LoginComponent {
    @Input() login: boolean = false;
    @Output() toggleLogin = new EventEmitter();
    @Output() toggleSignup = new EventEmitter();

    constructor(private translate: TranslateService) {
        translate.setDefaultLang('en');
        translate.use('en');
    }

    /* login button click handler */
    handleLogin() {
        this.toggleLogin.emit(true)
    }

    /* signUp button click handler */
    handleSignup() {
        this.toggleSignup.emit(true)
    }
}
