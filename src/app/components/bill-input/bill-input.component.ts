import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MatDialog, MatPaginator, MatTableDataSource, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { DialogComponent } from '../dialog/dialog.component';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { HttpClient } from '@angular/common/http';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import { isNgTemplate } from '@angular/compiler';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};
@Component({
  selector: 'app-bill-input',
  templateUrl: './bill-input.component.html',
  styleUrls: ['./bill-input.component.css'],
  providers: [{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }, { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },]
})
export class BillInputComponent {
  displayOtherFields = false;
  billType = [{ id: 1, type: 'Laptop Accessories' }, { id: 2, type: 'Mobile Accessories' }]
  invoiceCount: any;
  billForm: FormGroup;
  productList: any;
  tableData = new MatTableDataSource();
  showTable = false;
  columnsToDisplay = ['select', 'id', 'description', 'cost', 'quantity', 'selectedQuantity'];
  public selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  baseUrl: any;
  currentDate: any;
  grandTotal: number;
  units = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  constructor(private fb: FormBuilder, private firestore: AngularFirestore, private dialog: MatDialog, private formBuilder: FormBuilder, private http: HttpClient) {
    this.currentDate = new Date()
    this.billForm = this.fb.group({
      billType: null,
      invoiceNo: [{ value: null, disabled: true }],
      invoiceDate: [{ value: moment().format('YYYY-MM-DD'), disabled: true }],
      name: [null, Validators.required],
      mobileNo: [null, [Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$"), Validators.required]],
      deliveryNote: null,
      supplierRef: null,
      otherRef: null,
      termsofDeliveryHandDel: null,
      termsOfDelivery: null,
      termsOfDeliveryDate: null,
      dispatchDocumentNo: null,
      dispatchDocumentNoDated: null,
      dispatchedThrough: null,
      destination: null,
      warrantyNo: null,
      serialNo: null
    });

    firestore.collection('generated-invoices').valueChanges().subscribe(data => {
      console.log(data.length)
      this.invoiceCount = data.length + 1;
      this.billForm.get('invoiceNo').setValue(this.invoiceCount)
    });

    this.http.get('./assets/images/img9.jpg', { responseType: 'blob' })
      .subscribe(res => {
        const reader = new FileReader();
        reader.onloadend = () => {
          var base64data = reader.result;
          this.baseUrl = base64data;
        }

        reader.readAsDataURL(res);
      });

  }


  public onSelectBillType() {
    this.displayOtherFields = true;
    console.log(this.billForm.value.billType.id)
    this.fetchProducts(this.billForm.value.billType.id);
  }

  public fetchProducts(id) {
    let progressDialogRef = this.openProgressDialog();
    this.firestore.collection('products', ref => ref.where('category', '==', id)).valueChanges({ idField: 'id' }).subscribe(data => {
      progressDialogRef.close();
      console.log(data);
      this.productList = data;
      console.log(this.productList)
      this.showTable = true
      this.tableData = new MatTableDataSource(this.productList);
      this.tableData.paginator = this.paginator;
    })
  }

  public onClick(row) {
    this.selection.toggle(row)
  }


  public disableInput(i) {
    return !this.selection.isSelected(this.tableData.data[i])
  }
  public onSubmit() {
    let cloned: any = {};
    cloned = Object.assign({}, this.billForm.getRawValue());
    for (let obj in cloned) {
      if (cloned[obj] == null) {
        cloned[obj] = ' '
      }
      if (obj == 'termsOfDeliveryDate' || obj == 'dispatchDocumentNoDated') {
        if (cloned[obj] != ' ') {
          cloned[obj] = cloned[obj].format('YYYY-MM-DD');
        }
      }
    }
    console.log(cloned)

    let flag = false;
    console.log(this.selection.selected)
    for (let item of this.selection.selected) {
      if (item.selectedQuantity == null) {
        this.showCustomDialog('Please enter quantity for ' + item.description);
        flag = true;
        break;
      }
    }
    if (!flag) {
      for (let item of this.selection.selected) {
        this.firestore
          .collection('products')
          .doc(item.id)
          .update({ quantity: (item.quantity - item.selectedQuantity) });
      }
      let data = this.billForm.getRawValue();
      this.firestore.collection('generated-invoices').add({ category: data.billType.id, date: data.invoiceDate, mobile: data.mobileNo, name: data.name })
      this.open(cloned);
      this.selection.clear();
    }
    // this.open(cloned);

  }

  public open(data) {
    let docDefinition = {
      content: [
        //Image
        {
          style: 'tableExample',
          image: this.baseUrl,
          width: 525,
          height: 100,
        },
        //Invoice
        {
          style: 'tableExample',
          table: {
            widths: [515],
            heights: [10],
            body: [
              [{ text: 'INVOICE', alignment: 'center' }]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [250, 123.5, 123.5],
            body: [
              ['Made For Laptop & Mobile.\n Shop NO.4,Shastri Nagar,Near City\nHospital, Paud Road,Kothrud\nPune,Maharashtra\n411038\nMob.7447233814/8801776688',
                'Invoice:-\n' + data.invoiceNo + '\n\nDelivery Note:-\n' + data.deliveryNote + '\n\nSuppliers Ref:-\n' + data.supplierRef,
                'Date:-\n' + data.invoiceDate + '\n\nTerms of Payment:-\nCash\n\nOther Reference(s):-\n' + data.otherRef]

            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [250, 123.5, 123.5],
            body: [
              ['Consignee:\nName:\n' + data.name + '\n\nMobile Number:\n' + data.mobileNo,
              'Terms of Delivery:-\n' + data.termsOfDelivery + '\n\nDispatch Document No:-\n' + data.dispatchDocumentNo + '\n\nDispatched Through:-\n' + data.dispatchedThrough,
              'Dated:-\n' + data.termsOfDeliveryDate + '\n\nDated:-\n' + data.dispatchDocumentNoDated + '\n\nDestination:-\n' + data.destination]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [250, 256],
            body: [
              [
                'Type of Bill: ' + data.billType.type, 'Terms of Delivery Hand Del:-\n' + data.termsofDeliveryHandDel]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [250, 79, 79, 80],
            body: [
              ['Description of Goods & Services\t\t\t\t', 'Quantity\t\t\t\t', 'Cost\t\t\t\t\t\t\t\t', 'Total']
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [250, 79, 79, 80],
            heights: ['*', '*', '*', '*'],
            body: this.tableBody()
          }
        },
        {
          style: 'tableExample',
          table: {

            widths: [426, 80],
            heights: [10],
            body: [
              ['Grand Total', this.grandTotal]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [515],
            heights: [10],
            body: [
              [{ text: 'Amount Chargable (in words) : ' + this.transform(this.grandTotal) }]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [515],
            heights: [10],
            fontsize: 1,
            body: [
              [{ text: 'Declaration :\nWe declare that this invoice shows the actual\nprice of the goods and services described\nand that all particulars are true and correct.\nGoods Once sold will not be taken back.\t\t\t\tCustomer Signature\t\t\t\Authorized Signature', allignment: 'left', fontsize: 1 }]
            ]
          }
        }
      ]
    }
    pdfMake.createPdf(docDefinition).open();
  }

  public tableBody() {
    this.grandTotal = 0;
    let arr = [];
    let srNo = 1;
    for (let item of this.selection.selected) {
      let itemArr = [srNo++ + '. ' + item.description, item.selectedQuantity, item.cost, item.selectedQuantity * item.cost];
      arr.push(itemArr);
      this.grandTotal = this.grandTotal + (item.selectedQuantity * item.cost);
    }
    return arr;
  }

  public transform(value: any): any {
    if (value) {
      let number = parseFloat(value).toFixed(2).split(".")
      let num = parseInt(number[0]);
      let digit = parseInt(number[1]);
      if (num) {
        if ((num.toString()).length > 9) { return ''; }
        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        const d = ('00' + digit).substr(-2).match(/^(\d{2})$/);
        if (!n) { return ''; }
        let str = '';
        str += (Number(n[1]) !== 0) ? (this.units[Number(n[1])] || this.tens[n[1][0]] + ' ' + this.units[n[1][1]]) + 'Crore ' : '';
        str += (Number(n[2]) !== 0) ? (this.units[Number(n[2])] || this.tens[n[2][0]] + ' ' + this.units[n[2][1]]) + 'Lakh ' : '';
        str += (Number(n[3]) !== 0) ? (this.units[Number(n[3])] || this.tens[n[3][0]] + ' ' + this.units[n[3][1]]) + 'Thousand ' : '';
        str += (Number(n[4]) !== 0) ? (this.units[Number(n[4])] || this.tens[n[4][0]] + ' ' + this.units[n[4][1]]) + 'Hundred ' : '';
        str += (Number(n[5]) !== 0) ? (this.units[Number(n[5])] || this.tens[n[5][0]] + ' ' + this.units[n[5][1]]) + 'Rupees ' : '';
        str += (Number(d[1]) !== 0) ? ((str !== '') ? "and " : '') + (this.units[Number(d[1])] || this.tens[d[1][0]] + ' ' + this.units[d[1][1]]) + 'Paise /-' : '/-';
        return str;
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  public openProgressDialog() {
    return this.dialog.open(DialogComponent, {
      data: { dialogType: 'progressDialog', headerText: 'Please Wait' },
      width: "35%",
      disableClose: true,
      hasBackdrop: true
    });
  }

  public showCustomDialog(message) {
    const customDialogRef = this.dialog.open(DialogComponent, {
      data: { description: message, dialogType: 'customDialog' },
      width: "35%",
      hasBackdrop: true,
      disableClose: true
    })
  }
}