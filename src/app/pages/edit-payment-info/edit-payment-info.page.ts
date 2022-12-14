import { Component, OnInit } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { UserPaymentInfo } from 'src/app/model/userPaymentInfo';
import { AuthService } from 'src/app/services/auth.service';
import { CollectionsService } from 'src/app/services/collections/collections.service';
import { UserService } from 'src/app/services/user/user.service';
import { DEFAULT_FEE_AMOUNT } from '../add-member/add-member.page';
import { User as UserAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-payment-info',
  templateUrl: './edit-payment-info.page.html',
  styleUrls: ['./edit-payment-info.page.scss'],
})
export class EditPaymentInfoPage implements OnInit {
  public loading: HTMLIonLoadingElement;
  updateFeeForm: FormGroup;
  id: string;
  paymentId: string;
  docId: string;

  submitted: boolean;
  isShow = false;
  userPaymentInfo: UserPaymentInfo;
  paymentDetail: UserPaymentInfo;
  userAuth: UserAuth;

  constructor(private route: ActivatedRoute, private userService: UserService, private fb: FormBuilder,
    private alertController: AlertController, private router: Router, private authService: AuthService,
    private loadingController: LoadingController, private collectionService: CollectionsService) {
    // this.id = this.route.snapshot.paramMap.get('id').toLowerCase();
    // this.getLatestPaymentDetails(this.id);
    this.userAuth = authService.getCurrentUser();
    this.paymentId = this.route.snapshot.paramMap.get('paymentId');
    this.getTransactionWithId(this.paymentId);
  }

  get memberId() { return this.updateFeeForm.get('memberId'); }
  get memberName() { return this.updateFeeForm.get('memberName'); }
  get joiningDt() { return this.updateFeeForm.get('joiningDt'); }
  get feesPaid() { return this.updateFeeForm.get('feesPaid'); }
  get amount() { return this.updateFeeForm.get('amount'); }
  get subscriptionStartDt() { return this.updateFeeForm.get('subscriptionStartDt'); }
  get subscriptionEndDt() { return this.updateFeeForm.get('subscriptionEndDt'); }
  get numOfMonths() { return this.updateFeeForm.get('numOfMonths'); }

  ngOnInit() {
    this.updateFeeForm = this.fb.group({
      memberId: ['', [Validators.required, Validators.maxLength(6)]],
      memberName: ['', [Validators.required, Validators.maxLength(25)]],
      joiningDt: ['', [Validators.required]],
      feesPaid: ['', [Validators.required]],
      amount: ['', [Validators.min(DEFAULT_FEE_AMOUNT)]],
      subscriptionStartDt: ['', []],
      subscriptionEndDt: ['', []],
      numOfMonths: ['', []],
    }, { validators: [this.isCorrectAmount('amount')] } as AbstractControlOptions);
  }

  // async getLatestPaymentDetails(id: string) {
  //   const paymentData: UserPaymentInfo[] = [];
  //   const latestPayment = await this.collectionService.getLatestPaymentById(id);
  //   latestPayment.forEach(item => {
  //     paymentData.push(item.data());
  //   });

  //   const docIdList = await this.userService.getDocIdByUserId(paymentData[0].memberId);
  //   docIdList.forEach(item => {
  //     this.docId = item.id;
  //   });

  //   console.log(paymentData);
  //   this.memberId.setValue(paymentData[0].memberId);
  //   this.memberName.setValue(paymentData[0].memberName);
  //   this.joiningDt.setValue(this.formatDate((paymentData[0].joiningDt as any).toDate()));
  //   this.feesPaid.setValue(paymentData[0].feesPaid);
  //   if (this.feesPaid.value === 'yes') {
  //     this.amount.setValue(paymentData[0].amount);
  //     this.subscriptionStartDt.setValue(paymentData[0].subscriptionStartDt);
  //     this.subscriptionEndDt.setValue(paymentData[0].subscriptionEndDt);
  //     this.numOfMonths.setValue(paymentData[0].numOfMonths);
  //   }
  // }

  async getTransactionWithId(paymentId: string) {
    try {

      await this.showLoading();
      const paymentRef = await this.collectionService.getPaymentWithId(paymentId).get().toPromise();
      this.paymentDetail = { id: paymentRef.id, ...paymentRef.data() };

      const docIdList = await this.userService.getDocIdByUserId(this.paymentDetail.memberId);
      docIdList.forEach(item => {
        this.docId = item.id;
      });
      console.log(this.docId);

      this.memberId.setValue(this.paymentDetail.memberId);
      this.memberName.setValue(this.paymentDetail.memberName);
      this.joiningDt.setValue(this.formatDate((this.paymentDetail.joiningDt as any).toDate()));
      this.feesPaid.setValue(this.paymentDetail.feesPaid);
      if (this.feesPaid.value === 'yes') {
        this.amount.setValue(this.paymentDetail.amount);
        this.subscriptionStartDt.setValue(this.paymentDetail.subscriptionStartDt);
        this.subscriptionEndDt.setValue(this.paymentDetail.subscriptionEndDt);
        this.numOfMonths.setValue(this.paymentDetail.numOfMonths);
      }

      this.isShow = true;
      await this.hideLoading();

    } catch (error) {
      console.error(error);
      this.handleError(error);
      await this.hideLoading();
    }
  }

  async collectFormDetails() {
    this.submitted = false;
    this.userPaymentInfo = new UserPaymentInfo();

    if (this.feesPaid.value === 'yes') {
      this.userPaymentInfo = {
        memberId: this.updateFeeForm.get('memberId').value,
        memberName: this.updateFeeForm.get('memberName').value,
        gymName: this.userAuth.uid,
        joiningDt: new Date(this.updateFeeForm.get('joiningDt').value),
        feesPaid: this.updateFeeForm.get('feesPaid').value,
        amount: this.updateFeeForm.get('amount').value,
        subscriptionStartDt: this.updateFeeForm.get('subscriptionStartDt').value,
        subscriptionEndDt: this.updateFeeForm.get('subscriptionEndDt').value,
        numOfMonths: this.updateFeeForm.get('numOfMonths').value,
        paymentDateTime: this.feesPaid.value === 'yes' ? new Date() : null
      };
    }
    else {
      this.userPaymentInfo = {
        memberId: this.updateFeeForm.get('memberId').value,
        memberName: this.updateFeeForm.get('memberName').value,
        gymName: this.userAuth.uid,
        joiningDt: new Date(this.updateFeeForm.get('joiningDt').value),
        feesPaid: this.updateFeeForm.get('feesPaid').value,
        paymentDateTime: this.feesPaid.value === 'yes' ? new Date() : null
      };
    }

    await this.updatePayment();
  }

  async updatePayment() {
    try {

      await this.showLoading();

      await this.collectionService.updateUserPayment(this.paymentDetail.id, this.userPaymentInfo).then(() => {
        console.log('Added fee info successfully!', this.userPaymentInfo);
      });

      const data = {
        feesPaid: this.feesPaid.value,
        subscriptionEndDt: this.subscriptionEndDt.value
      };

      await this.userService.updateUser(this.docId, data).then(() => {
        console.log('Updated the member successfully!', data);
      });

      this.submitted = true;

      const alert = await this.alertController.create({
        header: 'Success',
        subHeader: 'Payment Edited',
        message: `The edited payment info has been updated for the Member ID: ${this.userPaymentInfo.memberId}!`,
        buttons: [{
          text: 'OK', handler: () => {
            this.router.navigate(['/payment-detail', this.paymentDetail.id]);
          }
        }]
      });

      await this.hideLoading();
      await alert.present();


    } catch (error) {
      console.error(error);
      this.handleError(error);
      await this.hideLoading();
    }
  }

  toggleFeePaidStatus(event) {
    if (event.target.value === 'yes') {
      this.amount.setValue(DEFAULT_FEE_AMOUNT);
      this.calculateFee();
    }
  }

  calculateFee() {
    const amount = this.amount.value;
    const subStartDt = this.subscriptionStartDt.value ? this.subscriptionStartDt.value : this.formatDate(new Date());
    const subEndDt = this.calculateEndDate(new Date(subStartDt), Math.floor(amount / DEFAULT_FEE_AMOUNT));
    const numOfMonths = this.numOfMonths.value;

    this.subscriptionStartDt.setValue(subStartDt);
    this.subscriptionEndDt.setValue(subEndDt);
    this.numOfMonths.setValue(this.monthDiff(new Date(subStartDt), new Date(subEndDt)));
  }

  calculateEndDate(subStartDt: Date, numOfMonths: number) {
    return this.formatDate(new Date(new Date().setMonth(subStartDt.getMonth() + numOfMonths, subStartDt.getDate())));
  }

  // UTILITY FUNCTIONS
  formatDate(date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 101).toString().substring(1);
    const day = (date.getDate() + 100).toString().substring(1);
    return year + '-' + month + '-' + day;
  }

  monthDiff(date1: Date, date2: Date) {
    let months;
    months = (date2.getFullYear() - date1.getFullYear()) * 12;
    months -= date1.getMonth();
    months += date2.getMonth();
    return months <= 0 ? 0 : (months * 1);
  }

  // CUSTOM FEE AMOUNT VALIDATOR
  isCorrectAmount(controlName: string): ValidationErrors | null {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      if (control.errors) {
        return;
      }

      if ((control.value * 1) % (DEFAULT_FEE_AMOUNT * 1) !== 0) {
        return control.setErrors({ correctAmount: true });
      } else {
        return control.setErrors(null);
      }
    };
  }

  // LOADERS AND ALERTS
  async showLoading(): Promise<void> {
    try {
      this.loading = await this.loadingController.create({
        message: 'Just a moment...',
        mode: 'ios'
      });
      await this.loading.present();
    } catch (error) {
      this.handleError(error);
    }
  }

  hideLoading(): Promise<boolean> {
    return this.loading.dismiss();
  }

  async handleError(error: { message: any }): Promise<void> {
    const alert = await this.alertController.create({
      message: error.message,
      buttons: [{ text: 'Ok', role: 'cancel' }]
    });
    await alert.present();
  }
}
