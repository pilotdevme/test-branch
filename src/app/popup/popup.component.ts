import { Component, OnInit } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: []
})
export class PopupComponent implements OnInit {
    myTitle = 'project-angular';
    open = false;

    toggle(event: any) {
        console.log(event);
        this.open = event.detail;
    }

    ngOnInit(): void {
        console.log("popup runs", chrome)
        chrome.runtime.sendMessage("helo", (res) => {
            console.log("res", res)
        })
    }



}
