import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {

  public spinnerGif = "./assets/images/Processing.gif";
  description: string;
  headerText: string;
  dialogType: string;

  constructor(private dialogRef: MatDialogRef<DialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.description = data.description;
    this.headerText = data.headerText;
    this.dialogType = data.dialogType;
  }

  ngOnInit() {
  }

}
