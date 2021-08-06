import {writable} from "svelte/store";

export const client = writable(null); //Will contain the IgClientApi

export const authInfo = writable({
	"user":"",
	"pw":""
})
