import * as fs from "fs";
import fetch from "node-fetch";
import Bottleneck from "bottleneck";

const dataBlock: object=JSON.parse(fs.readFileSync("./output.json", "utf-8"));
fs.existsSync("files/")? Function.prototype():fs.mkdirSync("files/");

const limiter=new Bottleneck({
	maxConcurrent: 10
});

dataBlock["media"].forEach(e => {
	e["media"].forEach((f, idx) => {

		//TODO: Limit the number of foncurrent fetch calls depending on the conneciton speed
		limiter.schedule(() => fetch(f["url"])).then(res => {
			const dest=fs.createWriteStream(`files/${e["timestamp"]}-${e["username"]}-${idx? idx:""}.${f["type"]==1? "jpg":"mp4"}`);
			res["body"].pipe(dest);

		}).catch((e) => {
			console.error(e);
		});
	});
});
