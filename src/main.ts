import {IgApiClient, IgLoginTwoFactorRequiredError, SavedFeedResponseCarouselMediaItem} from "instagram-private-api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
const SESSIONPATH="src/session.json";
dotenv.config();

let client=new IgApiClient();
let user;

function seshToFile(data) {
	fs.writeFile(SESSIONPATH, JSON.stringify(data), (e) => {
		if(e) {
			console.error(e);
			return false;
		}
	});
	return true;
}

function loadSeshFromFile() {
	//fs.access and fs.writeFile callbacks won't run for some reason, fallign back to synchronous alternatives
	try {
		fs.accessSync(SESSIONPATH);
	} catch(e) {
		console.error(e);
		return null;
	}

	try {
		let data: string=fs.readFileSync(SESSIONPATH, 'utf-8');
		if(data.length==0) {
			return null;
		} else {
			return JSON.parse(data);
		}
	} catch(e) {
		return null;
	}

}

async function validateSessionFile() {
	//TODO
}

client.state.generateDevice("saturn");
console.debug("Generated device");

console.info("AUTH...");

try {

	//Save up-to-date auth cookies after each request
	client.request.end$.subscribe(async () => {
		const serialized=await client.state.serialize();
		delete serialized.constants;
		seshToFile(serialized);
	});

	let sessionData=loadSeshFromFile();

	//TODO:move integrity checks to ValidateSessionfile()
	if(sessionData!=null||typeof sessionData!=="undefined") {
		console.debug("logged in using sessionData");
		await client.state.deserialize(sessionData);

	} else {
		console.debug("logged in with creds");
		await client.simulate.preLoginFlow();
		user=await client.account.login(process.env.USERNAME, process.env.PW);
		console.log("Finishing login process, please wait...");
		await client.simulate.postLoginFlow();
	}

} catch(e) {

	if(e instanceof IgLoginTwoFactorRequiredError) {
		const rl=readline.createInterface(process.stdin, process.stderr);
		console.log(client.state.checkpoint); // Checkpoint info here
		await client.challenge.auto(true); // Requesting sms-code or click "It was me" button
		console.log(client.state.checkpoint); // Challenge info here
		rl.question("Input verification code", async (answer) => {
			console.log(await client.challenge.sendSecurityCode(answer));
		});
	} else {
		console.error(e);
	}

};

//user ? console.log("AUTH OK") : console.log("NO");

//Retrieve the saved feed
const savedFeed=client.feed.saved();
let media=[];
let currentPostIndex: number=0;

console.info("parsing saved posts");

savedFeed.items$.subscribe({
	next(items) {
		items.forEach((v) => {
			let workingContent=[];
			let urls: Array<object>=[];
			let mediaCount: number=null;
			let username: string=null;

			readline.clearLine(process.stdout, 0);
			console.log(`[${currentPostIndex}] Processing post`);

			//Check ifthe post is a carousel
			v.hasOwnProperty("carousel_media")? (() => {
				workingContent=v.carousel_media;
				username=v.user.username;
				mediaCount=v.carousel_media_count;
			})():workingContent=[v];

			workingContent.forEach((j, idx) => {
				//MEDIA TYPES: 1=picture, 2=video
				if(j.media_type==1) {
					urls.push({"type": 1, "url": j.image_versions2.candidates[0].url});
				} else if(j.media_type==2) {
					urls.push({"type": 2, "url": j.video_versions[0].url});
				}

				//Carousel posts contain multiple urls per post, so we should only push to the array once we've got all the carousel media urls
				if(!mediaCount||(mediaCount&&idx==mediaCount-1)) {
					media.push({
						"timestamp": j.taken_at, //? idk if timestamp refers to the picture's or the post's, bc there are undefined timestamps in the output
						"index": currentPostIndex,
						"caption": j.caption!=null? j.caption.text:null,
						"username": username? username:j.user.username,
						"media": urls
					});
					urls=[];
					currentPostIndex++;
				}
			});

		});
	},
	error(err) {console.log(err);},
	complete() {
		const ws=fs.createWriteStream("output.json");
		console.log("Created/opened output.json for writing");

		const final: object={
			"account": process.env.USERNAME,
			"items": currentPostIndex,
			"media": media
		};

		ws.write(JSON.stringify(final, null, "\t"), "utf-8");
		ws.end();
		ws.on("finish", () => {console.log("done");});
	}
});