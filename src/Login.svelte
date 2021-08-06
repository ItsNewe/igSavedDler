<script lang=ts>
	import { IgApiClient } from  "instagram-private-api";
	import { client, authInfo} from "./stores";


	let username:String;
	let pw:String; //User auth
	async () => {
		let client = new IgApiClient();
		client.state.generateDevice(Math.random().toString(36).substring(2, 15));
	}

	async function attemptLogin(){
		let userTemp = await client.account.login(user, pw);
	}
</script>

<main>
	<div>
		<form on:submit={attemptLogin}> 
			<input type="text" placeholder="username" bind={username}/>
			<input type="password" placeholder="password" bind={pw}/>
			<input type="submit"/>
		</form>
	</div>
</main>