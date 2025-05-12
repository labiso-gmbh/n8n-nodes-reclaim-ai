import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  INodeProperties,
  NodeApiError,
  IHttpRequestOptions,
  NodeConnectionType, // Added
} from 'n8n-workflow';

export class ReclaimAiTask implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Reclaim.ai Task',
    name: 'reclaimAiTask',
    icon: 'file:ReclaimAi.svg', // You'll need to add an icon named ReclaimAi.svg in a folder N8N can access, or adjust this path
    group: ['action'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with Reclaim.ai tasks',
    defaults: {
      name: 'Reclaim.ai Task',
    },
    inputs: ['main'] as NodeConnectionType[], // Added explicit cast
    outputs: ['main'] as NodeConnectionType[], // Added explicit cast
    credentials: [
      {
        name: 'reclaimAiApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Create', value: 'create' },
          { name: 'Delete', value: 'delete' },
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Update', value: 'update' },
        ],
        default: 'create',
      },

      // Task ID: For Get, Update, Delete
      {
        displayName: 'Task ID',
        name: 'taskId',
        type: 'string', // API expects int64, but string input is fine for N8N
        default: '',
        displayOptions: {
          show: { operation: ['get', 'update', 'delete'] },
        },
        placeholder: 'Enter Task ID',
        description: 'The ID of the task',
        required: true, // Task ID is essential for these operations
      },

      // Fields for Create & Update
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Title of the task',
        // 'required' is handled by making it visible for 'create' and checking in execute
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'TASK',
        options: [
          // From API Spec
          { name: 'Task', value: 'TASK' },
          { name: 'Habit', value: 'HABIT' },
          { name: 'Buffer', value: 'BUFFER' },
          { name: 'One-on-One', value: 'ONE_ON_ONE' },
        ],
        description: 'Type of the task',
      },
      {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        typeOptions: { multiline: true },
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Notes for the task',
      },
      {
        displayName: 'Priority',
        name: 'priority',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'MEDIUM',
        options: [
          // From API Spec
          { name: 'Urgent', value: 'URGENT' },
          { name: 'High', value: 'HIGH' },
          { name: 'Medium', value: 'MEDIUM' },
          { name: 'Low', value: 'LOW' },
        ],
        description: 'Priority of the task',
      },
      {
        displayName: 'Category',
        name: 'category',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'WORK', // API default not specified, WORK is common
        options: [
          // From API Spec
          { name: 'Work', value: 'WORK' },
          { name: 'Personal', value: 'PERSONAL' },
          { name: 'Project', value: 'PROJECT' },
          { name: 'Meeting', value: 'MEETING' },
          { name: 'Learning', value: 'LEARNING' },
          { name: 'Travel', value: 'TRAVEL' },
          { name: 'Routine', value: 'ROUTINE' },
          { name: 'Uncategorized', value: 'UNCATEGORIZED' },
        ],
        description: 'Category of the task',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'NEW', // Common for create
        options: [
          // From API Spec
          { name: 'New', value: 'NEW' },
          { name: 'Scheduled', value: 'SCHEDULED' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Completed', value: 'COMPLETED' },
          { name: 'Cancelled', value: 'CANCELLED' },
          { name: 'Archived', value: 'ARCHIVED' },
        ],
        description: 'Status of the task',
      },
      {
        displayName: 'Event Sub Type',
        name: 'eventSubType',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'TASK',
        options: [
          // Selected subset from API Spec
          { name: 'Task', value: 'TASK' },
          { name: 'Meeting Prep', value: 'MEETING_PREP' },
          { name: 'Meeting Wrap Up', value: 'MEETING_WRAP_UP' },
          { name: 'Focus Block', value: 'FOCUS_BLOCK' },
          { name: 'Project Work', value: 'PROJECT_WORK' },
          { name: 'Travel Flight', value: 'TRAVEL_FLIGHT' },
          { name: 'Personal Appointment', value: 'PERSONAL_APPOINTMENT' },
          { name: 'Personal Exercise', value: 'PERSONAL_EXERCISE' },
          // Add more as needed from: TRAVEL_HOTEL, TRAVEL_CAR, TRAVEL_TRAIN, TRAVEL_BUS, TRAVEL_BOAT, TRAVEL_OTHER, PERSONAL_ERRAND, PERSONAL_MEAL, PERSONAL_BREAK, PERSONAL_OTHER
        ],
        description: 'Event sub type of the task',
      },
      {
        displayName: 'Due Date',
        name: 'due',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'When the task is due (ISO 8601 format)',
      },
      {
        displayName: 'Snooze Until',
        name: 'snoozeUntil',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Snooze the task until this date (ISO 8601 format)',
      },
      {
        displayName: 'Time Chunks Required',
        name: 'timeChunksRequired',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1, // API default is 1
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Number of 15-minute time chunks required for the task',
      },
      {
        displayName: 'Always Private',
        name: 'alwaysPrivate',
        type: 'boolean',
        default: false, // API default
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Whether the task should always be private',
      },
      {
        displayName: 'Event Color',
        name: 'eventColor',
        type: 'string',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        placeholder: '#RRGGBB or color name',
        description: 'Color for the event (e.g., #FF0000 or "blue")',
      },
      {
        displayName: 'Scheduling Mode',
        name: 'schedulingMode',
        type: 'options',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        default: 'AUTOMATIC', // API default not specified, AUTOMATIC is common
        options: [
          { name: 'Automatic', value: 'AUTOMATIC' },
          { name: 'Manual', value: 'MANUAL' },
        ],
        description: 'Scheduling mode for the task',
      },

      // For Get All
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: { minValue: 1 },
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: 20, // API default for pageSize
        description: 'Max number of results to return (pageSize)',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        typeOptions: { minValue: 0 }, // API is 0-indexed
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: 0, // API default is 0
        description: 'Page number to return (0-indexed)',
      },
      {
        displayName: 'Filter by Status',
        name: 'filterStatus',
        type: 'options',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: '', // Empty means no filter by status
        options: [
          { name: 'Any', value: '' },
          { name: 'New', value: 'NEW' },
          { name: 'Scheduled', value: 'SCHEDULED' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Completed', value: 'COMPLETED' },
          { name: 'Cancelled', value: 'CANCELLED' },
          { name: 'Archived', value: 'ARCHIVED' },
        ],
        description: 'Filter tasks by status',
      },
      {
        displayName: 'Filter by Type',
        name: 'filterType',
        type: 'options',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: '', // Empty means no filter by type
        options: [
          { name: 'Any', value: '' },
          { name: 'Task', value: 'TASK' },
          { name: 'Habit', value: 'HABIT' },
          { name: 'Buffer', value: 'BUFFER' },
          { name: 'One-on-One', value: 'ONE_ON_ONE' },
        ],
        description: 'Filter tasks by type',
      },
      {
        displayName: 'Filter Start Date',
        name: 'filterStart',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        description: 'Filter tasks created/scheduled on or after this date (ISO 8601)',
      },
      {
        displayName: 'Filter End Date',
        name: 'filterEnd',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        description: 'Filter tasks created/scheduled on or before this date (ISO 8601)',
      },
      {
        displayName: 'Include Source Details',
        name: 'includeSourceDetails',
        type: 'boolean',
        default: false, // API default
        displayOptions: {
          show: { operation: ['getAll', 'get'] },
        },
        description: 'Include source details in the response',
      },
      {
        displayName: 'Include Instances',
        name: 'includeInstances',
        type: 'boolean',
        default: true, // API default
        displayOptions: {
          show: { operation: ['getAll', 'get'] },
        },
        description: 'Include task instances in the response',
      },
      {
        displayName: 'Additional Filters (JSON)',
        name: 'filters',
        type: 'json',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: '{}',
        placeholder: '{ "status": "NEW", "type": "TASK" }',
        description:
          'JSON object of additional query parameters, e.g., status, type, start, end. Refer to Reclaim.ai API docs for options.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const length = items.length;

    for (let i = 0; i < length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const credentials = await this.getCredentials('reclaimAiApi');
        const apiKey = credentials.apiKey as string;
        const baseUrl = 'https://api.app.reclaim.ai/api/tasks';

        let endpoint = baseUrl;
        let method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: { [key: string]: any } = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qs: { [key: string]: any } = {};

        if (operation === 'create') {
          method = 'POST';
          const title = this.getNodeParameter('title', i) as string;
          if (!title) {
            throw new NodeOperationError(
              this.getNode(),
              'Title is required for create operation.',
              { itemIndex: i },
            );
          }
          body.title = title;
          body.type = this.getNodeParameter('type', i, 'TASK') as string;
          body.notes = this.getNodeParameter('notes', i, '') as string;
          body.priority = this.getNodeParameter('priority', i, 'MEDIUM') as string;
          body.category = this.getNodeParameter('category', i, 'WORK') as string;
          body.status = this.getNodeParameter('status', i, 'NEW') as string;
          body.eventSubType = this.getNodeParameter('eventSubType', i, 'TASK') as string;
          const due = this.getNodeParameter('due', i) as string;
          if (due) body.due = due;
          const snoozeUntil = this.getNodeParameter('snoozeUntil', i) as string;
          if (snoozeUntil) body.snoozeUntil = snoozeUntil;
          const timeChunksRequired = this.getNodeParameter('timeChunksRequired', i) as number;
          if (timeChunksRequired) body.timeChunksRequired = timeChunksRequired;

          // New properties for create
          body.alwaysPrivate = this.getNodeParameter('alwaysPrivate', i, false) as boolean;
          const eventColor = this.getNodeParameter('eventColor', i, '') as string;
          if (eventColor) body.eventColor = eventColor;
          body.schedulingMode = this.getNodeParameter('schedulingMode', i, 'AUTOMATIC') as string;
        } else if (operation === 'get' || operation === 'update' || operation === 'delete') {
          const taskId = this.getNodeParameter('taskId', i) as string;
          if (!taskId) {
            throw new NodeOperationError(
              this.getNode(),
              'Task ID is required for this operation.',
              { itemIndex: i },
            );
          }
          endpoint = `${baseUrl}/${taskId}`;
          if (operation === 'get') {
            method = 'GET';
            // Add query params for 'get' operation based on node properties
            qs.includeSourceDetails = this.getNodeParameter(
              'includeSourceDetails',
              i,
              false,
            ) as boolean;
            qs.includeInstances = this.getNodeParameter('includeInstances', i, true) as boolean;
          }
          if (operation === 'delete') method = 'DELETE';
          if (operation === 'update') {
            method = 'PATCH';
            // For update, only include fields that are provided
            const title = this.getNodeParameter('title', i, null) as string | null;
            if (title !== null) body.title = title;

            const type = this.getNodeParameter('type', i, null) as string | null;
            if (type !== null) body.type = type;

            const notes = this.getNodeParameter('notes', i, null) as string | null;
            if (notes !== null) body.notes = notes;

            const priority = this.getNodeParameter('priority', i, null) as string | null;
            if (priority !== null) body.priority = priority;

            const category = this.getNodeParameter('category', i, null) as string | null;
            if (category !== null) body.category = category;

            const status = this.getNodeParameter('status', i, null) as string | null;
            if (status !== null) body.status = status;

            const eventSubType = this.getNodeParameter('eventSubType', i, null) as string | null;
            if (eventSubType !== null) body.eventSubType = eventSubType;

            const due = this.getNodeParameter('due', i, null) as string | null;
            if (due !== null) body.due = due;

            const snoozeUntil = this.getNodeParameter('snoozeUntil', i, null) as string | null;
            if (snoozeUntil !== null) body.snoozeUntil = snoozeUntil;

            const timeChunksRequired = this.getNodeParameter('timeChunksRequired', i, null) as
              | number
              | null;
            if (timeChunksRequired !== null) body.timeChunksRequired = timeChunksRequired;

            // New properties for update
            const alwaysPrivate = this.getNodeParameter('alwaysPrivate', i, null) as boolean | null;
            if (alwaysPrivate !== null) body.alwaysPrivate = alwaysPrivate;

            const eventColor = this.getNodeParameter('eventColor', i, null) as string | null;
            if (eventColor !== null) body.eventColor = eventColor; // Allow empty string to clear

            const schedulingMode = this.getNodeParameter('schedulingMode', i, null) as
              | string
              | null;
            if (schedulingMode !== null) body.schedulingMode = schedulingMode;

            if (Object.keys(body).length === 0) {
              throw new NodeOperationError(
                this.getNode(),
                'At least one field must be provided for update operation.',
                { itemIndex: i },
              );
            }
          }
        } else if (operation === 'getAll') {
          method = 'GET';
          qs.pageSize = this.getNodeParameter('limit', i, 20) as number;
          qs.page = this.getNodeParameter('page', i, 0) as number; // API is 0-indexed

          // Specific filters
          const filterStatus = this.getNodeParameter('filterStatus', i, '') as string;
          if (filterStatus) qs.status = filterStatus;

          const filterType = this.getNodeParameter('filterType', i, '') as string;
          if (filterType) qs.type = filterType;

          const filterStart = this.getNodeParameter('filterStart', i, '') as string;
          if (filterStart) qs.start = filterStart;

          const filterEnd = this.getNodeParameter('filterEnd', i, '') as string;
          if (filterEnd) qs.end = filterEnd;

          qs.includeSourceDetails = this.getNodeParameter(
            'includeSourceDetails',
            i,
            false,
          ) as boolean;
          qs.includeInstances = this.getNodeParameter('includeInstances', i, true) as boolean;

          const filtersJson = this.getNodeParameter('filters', i, '{}') as string;
          try {
            const filters = JSON.parse(filtersJson);
            Object.assign(qs, filters); // User-defined filters can override specific ones if keys match
          } catch (error) {
            if (error instanceof Error) {
              throw new NodeOperationError(
                this.getNode(),
                `Invalid JSON in Additional Filters field: ${error.message}`,
                { itemIndex: i },
              );
            }
            throw new NodeOperationError(
              this.getNode(),
              'Invalid JSON in Additional Filters field.',
              { itemIndex: i },
            );
          }
        }

        const options: IHttpRequestOptions = {
          // Changed from OptionsWithUri
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          method,
          url: endpoint, // Changed from uri to url
          json: true,
        };

        if (method === 'POST' || method === 'PATCH') {
          options.body = body;
        }
        if (method === 'GET' && Object.keys(qs).length > 0) {
          options.qs = qs;
        }

        const responseData = await this.helpers.httpRequest(options);
        const taskIdForLog =
          operation === 'delete' || operation === 'update' || operation === 'get'
            ? (this.getNodeParameter('taskId', i, '') as string)
            : '';

        if (operation === 'delete') {
          if (responseData === '' || responseData === undefined) {
            // Typically for 204 No Content
            returnData.push({
              json: { success: true, id: taskIdForLog },
              pairedItem: { item: i },
            });
          } else if (
            typeof responseData === 'object' &&
            responseData !== null &&
            (responseData as any).success === true
          ) {
            // For 200 OK with a body like { success: true, id: ... }
            returnData.push({ json: responseData, pairedItem: { item: i } });
          } else {
            // Unexpected response for DELETE
            this.logger.warn(
              `Unexpected response for DELETE task ${taskIdForLog}: ${JSON.stringify(responseData)}`,
            );
            returnData.push({ json: responseData, pairedItem: { item: i } }); // Push as is, might be an error
          }
        } else if (operation === 'getAll') {
          if (Array.isArray(responseData)) {
            returnData.push(
              ...responseData.map((item) => ({ json: item, pairedItem: { item: i } })),
            );
          } else {
            this.logger.warn(
              `For 'getAll' tasks, expected an array from Reclaim.ai API, but received: ${JSON.stringify(
                responseData,
              )}`,
            );
            returnData.push({ json: responseData, pairedItem: { item: i } }); // Push as is
          }
        } else {
          // For create, get, update (when update returns a body)
          returnData.push({ json: responseData, pairedItem: { item: i } });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const itemErrorData: { error: string; details?: any } = { error: 'An error occurred' };
          if (error instanceof NodeApiError) {
            itemErrorData.error = error.message;
            itemErrorData.details = error.context; // Contains details from the HTTP request/response
          } else if (error instanceof NodeOperationError) {
            itemErrorData.error = error.message;
            itemErrorData.details = error.description; // User-friendly description if available
          } else if (error instanceof Error) {
            itemErrorData.error = error.message;
          } else {
            itemErrorData.error = 'An unknown error occurred';
            itemErrorData.details = String(error);
          }
          returnData.push({ json: itemErrorData, pairedItem: { item: i } });
          continue;
        }

        // If not continuing on fail, re-throw the error.
        if (error instanceof NodeApiError || error instanceof NodeOperationError) {
          throw error; // Re-throw N8N specific errors directly
        }
        if (error instanceof Error) {
          throw new NodeOperationError(this.getNode(), error, { itemIndex: i }); // Wrap standard errors
        }
        // For other unknown error types
        throw new NodeOperationError(
          this.getNode(),
          `An unknown error occurred: ${String(error)}`,
          {
            itemIndex: i,
          },
        );
      }
    }
    return [returnData];
  }
}
