import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OptionsComponent } from './options/options.component';
import { PopupComponent } from './popup/popup.component';
import { SampleComponent } from './sample/sample.component';

@NgModule({
    declarations: [
        AppComponent,
        OptionsComponent,
        PopupComponent,
        SampleComponent
    ],
    imports: [
        AppRoutingModule,
        BrowserModule
    ],
    providers: [
        //
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {

    //

}
