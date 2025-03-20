import * as SNS from '@aws-sdk/client-sns'

const base_class = "SNSServiceException",
fatal_class = ["AuthorizationErrorException", "EndpointDisabledException"];

export function is_sns_error(error){
	return error instanceof SNS[base_class] ;
}

export function is_fatal(error){

	return fatal_class.find((classname)=> error instanceof SNS[classname]);
}