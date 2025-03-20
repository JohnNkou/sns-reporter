import beautify from 'beautify'

const NotifierJs = await import('../src/notifier.js').then((d)=> d.default),
Notifier = new NotifierJs("arn:aws:sns:us-east-1:234576188177:Lokole-test-error");

for(let i=0; i < 5; i++){
	Notifier.send_later(i.toString(),{
		subject:"Testing "+i,
		message: {
			error:'ECONN',
			name:"BLATAN"
		}
	})

	await new Promise((resolve)=>{
		setTimeout(resolve,1000);
	})
}