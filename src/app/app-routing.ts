import { Routes } from '@angular/router';
import { OptionsComponent } from './options/options.component';
import { PopupComponent } from './popup/popup.component';
import { SampleComponent } from './sample/sample.component';

export const routes: Routes = [
    /* component routes */
    { path: '', component: PopupComponent },
    { path: 'options', component: OptionsComponent },
    { path: 'popup', component: PopupComponent },
    { path: 'sample', component: SampleComponent }
];

