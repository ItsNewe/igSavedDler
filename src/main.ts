import { IgApiClient, IgLoginTwoFactorRequiredError, SavedFeedResponseCarouselMediaItem } from "instagram-private-api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";

dotenv.config();

let client = new IgApiClient();
let user;

function seshToFile(data){
	fs.writeFile("session.json", JSON.stringify(data), (e)=>{
		if(e){
			console.error(e);
			return false;
		}
	});
	return true;
}

function loadSeshFromFile(path){
	//fs.access and fs.writeFile callbacks won't run for some reason, fallign back to synchronous alternatives
	try{
		fs.accessSync(path);
	}catch(e){
		console.error(e);
		return null;
	}

	try{
		let data:string=fs.readFileSync(path, 'utf-8');
		if(data.length==0){
			return null;
		} else {
			return JSON.parse(data);
		}
	}catch(e){
		return null;
	}
	
}

async function validateSessionFile(){
	//TODO
}

client.state.generateDevice("saturn");
console.debug("Generated device");

console.info("AUTH...");

try {
	
	//Save up-to-date auth cookies after each request
	client.request.end$.subscribe(async () => {
		const serialized = await client.state.serialize();
		delete serialized.constants;
		seshToFile(serialized);
	});

	let sessionData=loadSeshFromFile("./session.json");

	//TODO:move integrity checks to ValidateSessionfile()
	if(sessionData!=null || typeof sessionData!=="undefined"){
		console.debug("logged in using sessionData");
		await client.state.deserialize(sessionData);

	} else {
		console.debug("logged in with creds");
		await client.simulate.preLoginFlow();
		user = await client.account.login(process.env.USERNAME, process.env.PW);
	}
	
} catch (e){

	if(e instanceof IgLoginTwoFactorRequiredError){
		const rl = readline.createInterface(process.stdin, process.stderr);
		console.log(client.state.checkpoint); // Checkpoint info here
		await client.challenge.auto(true); // Requesting sms-code or click "It was me" button
		console.log(client.state.checkpoint); // Challenge info here
		rl.question("Input verification code", async (answer)=>{
			console.log(await client.challenge.sendSecurityCode(answer))
		});
	} else {
		console.error(e);
	}

};

user ? console.log("AUTH OK") : console.log("NO");

console.log("Finishing login process, please wait...")
await client.simulate.postLoginFlow();

//Retrieve the saved feed

const savedFeed = client.feed.saved();
console.info("parsing saved posts");
let media=[];

let e=0;
do{
	let items = await savedFeed.items();

	//v=post
	items.forEach((v, i)=>{
		let workingContent=[];
		let urls:Array<string>=[];
		let mediaCount:number=null;
		let username:string=null;
		let l:number=null;

		 v.hasOwnProperty("carousel_media")? (()=>{
			workingContent=v.carousel_media; //Cast the carousel object to match workingContent's type
			username=v.user.username;
			mediaCount=v.carousel_media_count;
			})():workingContent=[v];
			

		//TODO:differentiate between carousels and regular posts, to group them
		workingContent.forEach((j, idx)=>{
			//MEDIA TYPES: 1=picture, 2=video
			if(j.media_type==1){
				urls.push(j.image_versions2.candidates[0].url);
			} else if (j.media_type==2){
				urls.push(j.video_versions[0].url);
			}

			//Carousel posts contain multiple urls per post, so we should only push to the array once we've got all the carousel media urls
			if(!mediaCount || (mediaCount && idx==mediaCount-1)){
				media.push({
					"caption": j.caption!=null? j.caption.text:null,
					"username": username? username: j.user.username,
					"urls":urls
				});
				urls=[];
			}
		});
		
	});
} while(e>0);

const ws = fs.createWriteStream("output.json");
console.log("Created/opened output.json for writing");


ws.write(JSON.stringify(media, null, "\t"), "utf-8");
ws.end();
ws.on("finish", ()=>{console.log("done")});


async function doDl(){

}