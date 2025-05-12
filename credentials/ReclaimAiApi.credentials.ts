import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ReclaimAiApi implements ICredentialType {
	name = 'reclaimAiApi';
	displayName = 'Reclaim.ai API';
	documentationUrl = 'https://reclaim.ai';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
}
