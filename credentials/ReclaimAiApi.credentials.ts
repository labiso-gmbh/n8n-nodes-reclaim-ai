import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ReclaimAiApi implements ICredentialType {
  name = 'reclaimAiApi';
  displayName = 'Reclaim.ai API';
  readonly icon = 'file:../nodes/ReclaimAi.svg'; // Added readonly and correct path
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
