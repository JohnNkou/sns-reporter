import { SNSClient, PublishCommand, PublishBatchCommand } from '@aws-sdk/client-sns'
import beautify from 'beautify'

const { TOPIC_ARN } = process.env;
let INTERVAL = process.env.INTERVAL || 5000;

if(!TOPIC_ARN){
	throw Error("NO TOPIC ARN GIVEN");
}

export default class Notifier{
	#client;
	#interval;
	#queue;

	constructor(){
		this.#client = new SNSClient({ region:'us-east-1' });
		this.#queue = new Map();

		this.#interval = setInterval(async ()=>{
			let to_send = [];

			this.#queue.forEach((data,Id)=> to_send.push({
				Id,
				Message: data.message,
				Subject: data.subject
			}));

			if(to_send.length){
				console.log("Sending Batch Message");

				let command = new PublishCommand({
					TopicArn: TOPIC_ARN,
					Subject:"Erreur Rapport",
					Message: beautify(JSON.stringify(to_send),{ format:'json' })
				}),
				response = await this.#client.send(command).catch((error)=>({error}));

				if(response.error){
					return console.error("Error while trying to send interval publish",response.error);
				}

				to_send.forEach((r)=> this.#queue.delete(r.Id));
			}
			else{
				console.log("Nothing to publish");
			}
		}, INTERVAL)
	}

	send_later(id,data){
		let queue = this.#queue;

		if(!queue.has(id)){
			if(data.subject && data.message){
				queue.set(id,data);
			}
			else{
				throw Error("Data should have a subject and a message");
			}
		}
	}

	async send_messages(Subject,Message){
		const input = new PublishCommand({
			TopicArn: TOPIC_ARN,
			Message,
			Subject
		})
	}
}