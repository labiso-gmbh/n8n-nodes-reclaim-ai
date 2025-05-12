import { INodeType, ICredentialType } from 'n8n-workflow';

// Import the nodes and credentials
import { ReclaimAiTask } from './nodes/ReclaimAiTask.node';
import { ReclaimAiApi } from './credentials/ReclaimAiApi.credentials';

// Export the nodes and credentials as instances
export const nodeTypes: INodeType[] = [new ReclaimAiTask()];

export const credentialTypes: ICredentialType[] = [new ReclaimAiApi()];
