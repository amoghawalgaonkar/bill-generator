import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { DialogComponent } from '../dialog/dialog.component';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { HttpClient } from '@angular/common/http';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-bill-input',
  templateUrl: './bill-input.component.html',
  styleUrls: ['./bill-input.component.css']
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

  constructor(private fb: FormBuilder, private firestore: AngularFirestore, private dialog: MatDialog, private formBuilder: FormBuilder, private http: HttpClient) {
    this.billForm = this.fb.group({
      billType: null,
      invoiceNo: [{ value: null, disabled: true }],
      invoiceDate: new Date(),
      name: null,
      mobileNo: [null, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")],
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
          // console.log(base64data);
          this.baseUrl = base64data;
        }

        reader.readAsDataURL(res);
        // console.log(res);
        // this.baseUrl = res;
        // console.log(this.baseUrl);
      });


  }


  onSelectBillType() {
    this.displayOtherFields = true;
    this.fetchProducts();
  }

  onSubmit() {
    // let flag = false;
    // console.log(this.selection.selected)
    // for (let item of this.selection.selected) {
    //   if (item.selectedQuantity == null) {
    //     this.showCustomDialog('Please enter quantity for ' + item.description);
    //     flag = true;
    //     break;
    //   }
    // }
    // if (!flag) {
    //   this.open();
    // }
    this.open();

  }

  fetchProducts() {
    let progressDialogRef = this.openProgressDialog();
    this.firestore.collection('products', ref => ref.where('category', '==', 1)).valueChanges().subscribe(data => {
      progressDialogRef.close();
      console.log(data);
      this.productList = data;
      console.log(this.productList)
      this.showTable = true
      this.tableData = new MatTableDataSource(this.productList);
      this.tableData.paginator = this.paginator;
    })
  }
  public openProgressDialog() {
    return this.dialog.open(DialogComponent, {
      data: { dialogType: 'progressDialog', headerText: 'Please Wait' },
      width: "35%",
      disableClose: true,
      hasBackdrop: true
    });
  }

  public onClick(row) {
    this.selection.toggle(row)
  }

  public disableInput(i) {
    return !this.selection.isSelected(this.tableData.data[i])
  }

  public showCustomDialog(message) {
    const customDialogRef = this.dialog.open(DialogComponent, {
      data: { description: message, dialogType: 'customDialog' },
      width: "35%",
      hasBackdrop: true,
      disableClose: true
    })
  }

  public open() {
    let docDefinition = {
      content: [
        //Image
        {
          style: 'tableExample',
          image: this.baseUrl,
          width: 525,
          height: 100,
        },
        // {
        //   style: 'tableExample',
        //   table: {
        //     widths: [515],
        //     heights: [100],
        //     body: [
        //       [{ image: this.baseUrl }]
        //     ]
        //   }
        // },
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
            widths: [275, 110, 112],
            body: [
              ['Made For Laptop & Mobile.\n Shop NO.4,Shastri Nagar,Near City\nHospital, Paud Road,Kothrud\nPune,Maharashtra\n411038\nMob.7447233814/8801776688',
                'Invoice:-\n1\n\nDelivery Note:-\n1\n\nSuppliers Ref:-\n1',
                'Date:-\n21/09/2020\n\nTerms of Payment:-\nCash\n\nOther Reference(s):-\n1']

            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            widths: [275, 110, 112],
            body: [
              ['Consignee:\nName:\nTest\n\nMobile Number:\n111\n\nType of Bill:\nLaptop',
                'Terms of Delivery:-\nABC\n\nDispatch Document No:-\n111\n\nDispatched Through:-\n111',
                'Dated:-\n111\n\nDated:-\n111\n\nDestination:-\nPune\n\nTerms of Delivery Hand Del:-\n111']
            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: [515],
            heights: [10],
            body: [
              [{ text: 'Description of Goods & Services\t\t\t\tQuanitiy\t\t\t\tCost\t\t\t\t\t\t\t\tTotal', alignment: 'left', colspan: 2 }]

            ]
          }
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: [515],
            heights: [150],
            body: [
              ['']

            ]
          }
        },
        {
          style: 'tableExample',
          table: {

            widths: [515],
            heights: [10],
            body: [
              [{ text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\tSub Total', allignment: 'left' }]

            ]
          }
        },
        {
          style: 'tableExample',
          table: {

            widths: [515],
            heights: [10],
            body: [
              [{ text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\tGrand Total', allignment: 'left' }]
            ]
          }
        },
        {
          style: 'tableExample',
          table: {

            widths: [515],
            heights: [10],
            body: [
              [{ text: 'Amount Chargable (in words) : ', allignment: 'left' }]
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


}
