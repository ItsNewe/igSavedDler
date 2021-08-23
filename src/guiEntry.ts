import {
	QMainWindow,
	QWidget,
	QLabel,
	FlexLayout,
	QPushButton,
	QLineEdit,
	EchoMode,
	QApplication,
	QDesktopWidget
} from '@nodegui/nodegui';
//import logo from '../assets/logox200.png';

import {igInteractionModule} from "./main";

const kobos:igInteractionModule = new igInteractionModule();

//Store the widget hierarchy in a tree? Idk if Qt already implements it or not
class treeNode {
	value: any=null;
	children: Array<treeNode>=[];
	parent: any;

	constructor(value: QWidget, parent: treeNode) {
		this.value=value;
		if(parent) {this.parent=parent;}
	}
}

async function displayHome(){
	//TODO
}


//INIT
//Configure the window
const win=new QMainWindow();
win.setWindowTitle("IgDl");
win.resize(500, 500);

const centralWidget=new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout=new FlexLayout();
centralWidget.setLayout(rootLayout);

if(!kobos.sessionLogin()) {
	const label=new QLabel();
	label.setObjectName("mainlabel");
	label.setText("Login");

	const usernameField=new QLineEdit();
	const pwField=new QLineEdit();
	pwField.setEchoMode(EchoMode.Password);

	const submit=new QPushButton();
	submit.setText("Login");

	rootLayout.addWidget(label);
	rootLayout.addWidget(usernameField);
	rootLayout.addWidget(pwField);
	rootLayout.addWidget(submit);


	submit.addEventListener("clicked", ()=>{
		if(kobos.credentialsLogin()){
			//SHOW HOMEPAGE
			Function.prototype();
		} else {
			Function.prototype();
			//HANDLE INVALID LOGIN
		}

	})

} else {
	Function.prototype();
	//SHOW HOMEPAGE

}
	win.setCentralWidget(centralWidget);
	win.setStyleSheet(
		`
    #myroot {
      background-color: #ff0701;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
    }
  `
	);

	win.show();

(global as any).win=win;
