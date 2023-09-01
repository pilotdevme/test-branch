import { Component, ViewEncapsulation, OnInit } from '@angular/core';

/*
 * 'ViewEncapsulation.None' is used to set page body margins to 0 for this component.
 * If body margins is set to 0 globally (for example, if bootstrap is used), you can
 * remove this parameter.
*/
@Component({
    standalone: true,
    selector: 'app-sample',
    templateUrl: './sample.component.html',
    styleUrls: ['./sample.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SampleComponent implements OnInit {
    public content = "Hello!"

    public onBtnClick(): void {
        alert('SampleComponent.onBtnClick() new awork');
    }

    ngOnInit(): void {
        this.content = "Hello World!"
    }
}
