import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { map } from 'rxjs/operators';

import { User } from '../../model/user';
import { UserService } from '../../services/user/user.service';
import pdfMake from "pdfmake/build/pdfmake";  
import pdfFonts from "pdfmake/build/vfs_fonts";  
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-view-all-members',
  templateUrl: './view-all-members.page.html',
  styleUrls: ['./view-all-members.page.scss'],
})
export class ViewAllMembersPage implements OnInit {
  users?: User[] = [];
  public loading: HTMLIonLoadingElement;
  show = false;
  userName: string;
  userPass: string;
  status: string;
  currentUser?: User;
  currentIndex = -1;
  title = '';
  searchTerm: string;
  isShow = false;

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService,
    private loadingController: LoadingController, private alertController: AlertController) {
    this.status = this.route.snapshot.paramMap.get('status');
  }

  ngOnInit() {
    this.retrieveUsers(this.status);
  }

  async retrieveUsers(status?: string): Promise<void> {
    try {

      await this.showLoading();

      this.userService.getAllUsers(status).snapshotChanges().pipe(
        map(changes =>
          changes.map(c =>
            ({ id: c.payload.doc.id, ...c.payload.doc.data() })
          )
        )
      ).subscribe(data => {
        this.users = data;
        console.log('u', this.users);
        this.isShow = true;
      });

      await this.hideLoading();

    } catch (error) {
      console.error(error);
      this.handleError(error);
      await this.hideLoading();
    }
  }

  editMember(id: string) {
    console.log(`From EditMember: ID: ${id}`);
    this.router.navigate(['edit-member', id.toLowerCase()]);
  }

  updatePayment(id: string) {
    console.log(`From UpdatePayment: ID: ${id}`);
    this.router.navigate(['update-payment', id.toLowerCase()]);
  }

  generatePDF() {  
    let docDefinition = {  
      content: [  
        {  
          text: 'EXTREME GYM',  
          fontSize: 16,  
          alignment: 'center',  
          color: '#047886'  
        },  
        {  
          text: 'LIST OF USERS',  
          fontSize: 20,  
          bold: true,  
          alignment: 'center',  
          decoration: 'underline',  
          color: 'skyblue'  
        } ,
        {  
          table: {  
              headerRows: 1,  
              widths: ['auto', 'auto', 'auto', 'auto','auto','auto'],  
              body: [  
                  ['memberId', 'memberName','gender','subscriptionEndDate','Phone Number','Active'],  
                  ...this.users.map(p => ([p.memberId,p.memberName,p.gender,p.subscriptionEndDt,p.phoneNumber,p.active])),  
              ]  
          }  
      }  
        
      ] 
    };  
   
    pdfMake.createPdf(docDefinition).open();  
  }  

  async deleteMember(user: User) {
    console.log(`From DeleteMember: ID: ${user.id}`);
    await this.showLoading();
    const inputAlert = await this.alertController.create({
      message: `Are you sure want to delete this member ${user.memberName} with id: ${user.memberId}?`,
      buttons: [{
        text: 'Delete', handler: async () => {
          await this.showLoading();
          // DELETE USER HERE!
          await this.userService.deleteUser(user.id);
          await this.retrieveUsers(this.status);
          await this.hideLoading();
          await this.handleError({ message: 'Member Succesfully Deleted!' });
        }
      }, { text: 'Cancel', role: 'cancel', }]
    });
    await this.hideLoading();
    await inputAlert.present();
  }

  async showLoading(): Promise<void> {
    try {
      this.loading = await this.loadingController.create();
      await this.loading.present();
    } catch (error) {
      this.handleError(error);
    }
  }

  hideLoading(): Promise<boolean> {
    return this.loading.dismiss();
  }

  async handleError(error): Promise<void> {
    const alert = await this.alertController.create({
      message: error.message,
      buttons: [{ text: 'Ok', role: 'cancel' }]
    });
    await alert.present();
  }
}
