import { SNSClient, PublishCommand, PublishBatchCommand } from '@aws-sdk/client-sns'
import { EventEmitter } from 'node:events'
import beautify from 'beautify'
import { is_sns_error, is_fatal } from './utils.js'
import { SEND_STATUS } from './constant.js'

const INTERVAL = process.env.INTERVAL || 5000;

export default class Notifier extends EventEmitter{
	#client;
	#interval;
	#queue;
	#topic_arn;
	fatal;

	constructor(topic_arn){
		super();
		this.#client = new SNSClient({ region:'us-east-1' });
		this.#topic_arn = topic_arn;
		this.#queue = new Map();
		this.send_later = this.send_later.bind(this);
		this.send_message = this.send_message.bind(this);

		this.#interval = setInterval(async ()=>{
			let to_send = [];

			this.#queue.forEach((payload,Id)=> {
				if(payload.status == SEND_STATUS.WAITING){
					to_send.push({
						Id,
						Message: payload.data.message,
						Subject: payload.data.subject
					})
				}
			});

			if(to_send.length){
				console.log("Sending Batch Message");

				let command = new PublishCommand({
					TopicArn: this.#topic_arn,
					Subject:"Erreur Rapport",
					Message: beautify(JSON.stringify(to_send),{ format:'json' })
				}),
				response = await this.#client.send(command).catch((error)=>({error}));

				if(response.error){
					console.error("Error while trying to send interval publish",response.error);

					if(is_sns_error(response.error)){
						if(!is_fatal(response.error)){
							return;
						}
					}

					this.fatal = true;
					this.emit('fatal',response.error);

					return;
				}

				console.log("Sending Success");

				to_send.forEach((r)=> {
					if(!this.#queue.delete(r.Id)){
						console.error("RECORD COULDN'T BE DELETED FROM THE QUEUE",r);
					}
				});
			}
		}, INTERVAL)
	}

	send_later(id,data){
		let queue = this.#queue;

		if(!queue.has(id)){
			if(data.subject && data.message){
				queue.set(id,{
					status: SEND_STATUS.WAITING,
					data
				});

				return true;
			}
			else{
				throw Error("Data should have a subject and a message");
			}
		}

		return false;
	}

	async send_message(Subject,Message){
		const command = new PublishCommand({
			TopicArn: this.#topic_arn,
			Message,
			Subject
		}),
		response = await this.#client.send(command).catch((error)=>({error}));

		return response;
	}
}