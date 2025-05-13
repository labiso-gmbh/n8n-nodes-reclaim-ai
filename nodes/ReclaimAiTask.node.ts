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
  ILoadOptionsFunctions, // Added
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
          { name: 'Mark Task as', value: 'markTaskAs' },
        ],
        default: 'create',
      },

      // Task ID: For Get, Update, Delete, Mark Task as
      {
        displayName: 'Task ID',
        name: 'taskId',
        type: 'string', // API expects int64, but string input is fine for N8N
        default: '',
        displayOptions: {
          show: { operation: ['get', 'update', 'delete', 'markTaskAs'] },
        },
        placeholder: 'Enter Task ID',
        description: 'The ID of the task',
        required: true, // Task ID is essential for these operations
      },

      // Fields for "Mark Task as" operation
      {
        displayName: 'Mark as',
        name: 'markAsAction',
        type: 'options',
        displayOptions: {
          show: { operation: ['markTaskAs'] },
        },
        default: 'done',
        options: [
          { name: 'Done', value: 'done' },
          { name: 'To Do', value: 'todo' },
        ],
        description: 'Mark the task as Done or To Do',
        required: true,
      },

      // Fields for Create & Update
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: {
          show: { operation: ['create'] },
        },
        description: 'Title of the task',
        required: true,
      },
      {
        displayName: 'Title (Optional)',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: {
          show: { operation: ['update'] },
        },
        description: 'Title of the task (only if updating)',
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
        default: 'P3', // User-facing default
        options: [
          { name: 'Urgent', value: 'P1' },
          { name: 'High', value: 'P2' },
          { name: 'Medium', value: 'P3' },
          { name: 'Low', value: 'P4' },
        ],
        description: 'Priority of the task',
        required: true,
      },
      {
        displayName: 'Time Schedule',
        name: 'timeSchedule',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getTimeSchedules',
        },
        default: '',
        displayOptions: {
          show: { operation: ['create'] },
        },
        description: 'The schedule associated with the task',
        required: true,
      },
      {
        displayName: 'Event Category',
        name: 'eventCategory',
        type: 'options',
        displayOptions: {
          show: { operation: ['create'] },
        },
        default: 'WORK',
        options: [
          { name: 'Work', value: 'WORK' },
          { name: 'Personal', value: 'PERSONAL' },
        ],
        description: 'Category of the task',
        required: true,
      },
      {
        displayName: 'Due Date (UTC Time)',
        name: 'due',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'When the task is due (ISO 8601 format)',
      },
      {
        displayName: 'Snooze Until (UTC Time)',
        name: 'snoozeUntil',
        type: 'dateTime',
        default: '',
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Snooze the task until this date (ISO 8601 format)',
      },
      {
        displayName: 'Duration (in minutes)',
        name: 'duration',
        type: 'number',
        typeOptions: { minValue: 15, step: 15 },
        default: 15, // Default to 15 minutes
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Enter the time required in minutes (15-minute increments).',
        required: true,
      },
      {
        displayName: 'Minimum Chunk Size (in minutes)',
        name: 'minChunkSize',
        type: 'number',
        typeOptions: { minValue: 15, step: 15 },
        default: 15, // Default to 15 minutes
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Minimum duration of task sessions in minutes (15-minute increments).',
        required: true,
      },
      {
        displayName: 'Maximum Chunk Size (in minutes)',
        name: 'maxChunkSize',
        type: 'number',
        typeOptions: { minValue: 15, step: 15 },
        default: 90, // Default to 90 minutes
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Maximum duration of task sessions in minutes (15-minute increments).',
        required: true,
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
        required: true,
      },
      {
        displayName: 'Up Next',
        name: 'onDeck',
        type: 'boolean',
        default: false, // API default
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Whether the task should be marked as "Up Next"',
        required: true,
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

      // Filters for "Get All" operation
      {
        displayName: 'Status',
        name: 'statusFilter',
        type: 'multiOptions',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        default: ['COMPLETE', 'NEW', 'IN_PROGRESS', 'SCHEDULED'],
        options: [
          { name: 'New', value: 'NEW' },
          { name: 'Scheduled', value: 'SCHEDULED' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Complete', value: 'COMPLETE' },
          { name: 'Archived', value: 'ARCHIVED' },
          { name: 'Cancelled', value: 'CANCELLED' },
        ],
        description: 'Filter tasks by one or more statuses.',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getTimeSchedules(this: ILoadOptionsFunctions) {
        this.logger.debug('Starting getTimeSchedules method');

        const credentials = await this.getCredentials('reclaimAiApi');
        this.logger.debug('Retrieved credentials for Reclaim.ai API');

        const apiKey = credentials.apiKey as string;
        const options: IHttpRequestOptions = {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          method: 'GET',
          url: 'https://api.app.reclaim.ai/api/timeschemes',
          json: true,
        };

        this.logger.debug('Prepared API request options', { options });

        try {
          const responseData = await this.helpers.httpRequest(options);
          this.logger.debug('Received response from Reclaim.ai API', { responseData });

          if (!Array.isArray(responseData)) {
            this.logger.error('Unexpected response format', { responseData });
            throw new NodeApiError(this.getNode(), responseData, {
              message: 'Unexpected response format when fetching time schedules',
            });
          }

          const schedules = responseData.map(
            (schedule: { id: string; name: string; title: string }) => ({
              name: schedule.title, // Use the title for the dropdown display
              value: schedule.id,
            }),
          );

          this.logger.debug('Mapped response data to dropdown options', { schedules });
          return schedules;
        } catch (error) {
          this.logger.error('Error occurred while fetching time schedules', { error });
          throw error;
        }
      },
    },
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
        const baseUrl = 'https://api.app.reclaim.ai/api'; // Adjusted baseUrl for new operations

        let endpoint = ''; // Initialize endpoint
        let method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: { [key: string]: any } = {};

        if (operation === 'create') {
          method = 'POST';
          endpoint = `${baseUrl}/tasks`;
          const title = this.getNodeParameter('title', i) as string;
          if (!title) {
            throw new NodeOperationError(
              this.getNode(),
              'Title is required for create operation.',
              { itemIndex: i },
            );
          }
          body.title = title;
          const timeSchedule = this.getNodeParameter('timeSchedule', i) as string;
          if (!timeSchedule) {
            throw new NodeOperationError(
              this.getNode(),
              'Time Schedule is required for create operation.',
              { itemIndex: i },
            );
          }
          body.timeSchemeId = timeSchedule;

          // Convert minutes to 15-minute chunks for timeChunksRequired
          const duration = this.getNodeParameter('duration', i, 15) as number;
          const timeChunks = Math.ceil(duration / 15);
          body.timeChunksRequired = timeChunks;

          // Required field - alwaysPrivate
          body.alwaysPrivate = this.getNodeParameter('alwaysPrivate', i, false) as boolean;

          // Required field - onDeck
          body.onDeck = this.getNodeParameter('onDeck', i, false) as boolean;

          // Required field - priority
          body.priority = this.getNodeParameter('priority', i, 'P2') as string;

          // Required field - eventCategory
          body.eventCategory = this.getNodeParameter('eventCategory', i, 'WORK') as string;

          // Required fields - minChunkSize and maxChunkSize
          // Convert minutes to 15-minute chunks for minChunkSize and maxChunkSize
          const minChunkSizeMinutes = this.getNodeParameter('minChunkSize', i, 15) as number;
          const maxChunkSizeMinutes = this.getNodeParameter('maxChunkSize', i, 90) as number;
          body.minChunkSize = Math.ceil(minChunkSizeMinutes / 15);
          body.maxChunkSize = Math.ceil(maxChunkSizeMinutes / 15);

          // Optional fields
          const due = this.getNodeParameter('due', i) as string;
          if (due && due !== '') {
            const dueDate = new Date(due);
            if (isNaN(dueDate.getTime())) {
              throw new NodeOperationError(this.getNode(), 'Invalid due date format', {
                itemIndex: i,
              });
            }
            body.due = dueDate.toISOString();
          }

          const snoozeUntil = this.getNodeParameter('snoozeUntil', i) as string;
          if (snoozeUntil && snoozeUntil !== '') {
            const snoozeDate = new Date(snoozeUntil);
            if (isNaN(snoozeDate.getTime())) {
              throw new NodeOperationError(this.getNode(), 'Invalid snooze until date format', {
                itemIndex: i,
              });
            }
            body.snoozeUntil = snoozeDate.toISOString();
          }

          // New properties for create
          const eventColor = this.getNodeParameter('eventColor', i, '') as string;
          if (eventColor && eventColor !== '') body.eventColor = eventColor;

          // Optional fields
          const notes = this.getNodeParameter('notes', i, '') as string;
          if (notes) body.notes = notes;
        } else if (operation === 'get' || operation === 'update' || operation === 'delete') {
          const taskId = this.getNodeParameter('taskId', i) as string;
          if (!taskId) {
            throw new NodeOperationError(
              this.getNode(),
              'Task ID is required for this operation.',
              { itemIndex: i },
            );
          }
          endpoint = `${baseUrl}/tasks/${taskId}`;
          if (operation === 'get') {
            method = 'GET';
          }
          if (operation === 'delete') method = 'DELETE';
          if (operation === 'update') {
            method = 'PATCH';

            // Always include required fields for update operation
            const eventCategory = this.getNodeParameter('eventCategory', i, null) as string | null;
            if (eventCategory !== null) body.eventCategory = eventCategory;

            const priority = this.getNodeParameter('priority', i, null) as string | null;
            if (priority !== null) body.priority = priority;

            const minChunkSize = this.getNodeParameter('minChunkSize', i, null) as number | null;
            if (minChunkSize !== null) body.minChunkSize = Math.ceil(minChunkSize / 15);

            const maxChunkSize = this.getNodeParameter('maxChunkSize', i, null) as number | null;
            if (maxChunkSize !== null) body.maxChunkSize = Math.ceil(maxChunkSize / 15);

            const alwaysPrivate = this.getNodeParameter('alwaysPrivate', i, null) as boolean | null;
            if (alwaysPrivate !== null) body.alwaysPrivate = alwaysPrivate;

            const onDeck = this.getNodeParameter('onDeck', i, null) as boolean | null;
            if (onDeck !== null) body.onDeck = onDeck;

            const title = this.getNodeParameter('title', i, null) as string | null;
            if (title !== null) body.title = title;

            const notes = this.getNodeParameter('notes', i, null) as string | null;
            if (notes !== null) body.notes = notes;

            const duration = this.getNodeParameter('duration', i, null) as number | null;
            if (duration !== null) body.timeChunksRequired = Math.ceil(duration / 15);

            const due = this.getNodeParameter('due', i, null) as string | null;
            if (due !== null && due !== '') {
              const dueDate = new Date(due);
              if (isNaN(dueDate.getTime())) {
                throw new NodeOperationError(this.getNode(), 'Invalid due date format', {
                  itemIndex: i,
                });
              }
              body.due = dueDate.toISOString();
            }

            const snoozeUntil = this.getNodeParameter('snoozeUntil', i, null) as string | null;
            if (snoozeUntil !== null && snoozeUntil !== '') {
              const snoozeDate = new Date(snoozeUntil);
              if (isNaN(snoozeDate.getTime())) {
                throw new NodeOperationError(this.getNode(), 'Invalid snooze until date format', {
                  itemIndex: i,
                });
              }
              body.snoozeUntil = snoozeDate.toISOString();
            }

            const eventColor = this.getNodeParameter('eventColor', i, null) as string | null;
            if (eventColor !== null && eventColor !== '') body.eventColor = eventColor;

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
          const queryParams = new URLSearchParams();

          const statusFilter = this.getNodeParameter('statusFilter', i, []) as string[];
          if (statusFilter && statusFilter.length > 0) {
            queryParams.append('status', statusFilter.join(',')); // Join statuses with a comma
          }

          const queryString = queryParams.toString();
          if (queryString) {
            endpoint = `${baseUrl}/tasks?${queryString}`;
          }
        } else if (operation === 'markTaskAs') {
          method = 'POST';
          const taskId = this.getNodeParameter('taskId', i) as string;
          if (!taskId) {
            throw new NodeOperationError(
              this.getNode(),
              'Task ID is required for Mark Task as operation.',
              {
                itemIndex: i,
              },
            );
          }
          const markAsAction = this.getNodeParameter('markAsAction', i) as string;
          if (!markAsAction) {
            throw new NodeOperationError(this.getNode(), 'Mark as action is required.', {
              itemIndex: i,
            });
          }

          if (markAsAction === 'done') {
            endpoint = `${baseUrl}/planner/done/task/${taskId}`;
          } else if (markAsAction === 'todo') {
            endpoint = `${baseUrl}/planner/unarchive/task/${taskId}`;
          } else {
            throw new NodeOperationError(this.getNode(), `Invalid markAsAction: ${markAsAction}`, {
              itemIndex: i,
            });
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

        this.logger.debug(
          `Reclaim.ai API Request Options for operation '${operation}': ${JSON.stringify(options, null, 2)}`,
        );

        if (method === 'POST' || method === 'PATCH') {
          options.body = body;
        }

        this.logger.debug('Request body:', { body });
        this.logger.debug(`Request URL for GET: ${method === 'GET' ? endpoint : ''}`);

        const responseData = await this.helpers.httpRequest(options);

        this.logger.debug('Response data:', { responseData });

        const taskIdForLog =
          operation === 'delete' ||
          operation === 'update' ||
          operation === 'get' ||
          operation === 'markTaskAs' // Added markTaskAs
            ? (this.getNodeParameter('taskId', i) as string)
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
        } else if (operation === 'markTaskAs') {
          // For markTaskAs, Reclaim API might return 200 OK with a simple success message or 204 No Content
          if (
            responseData === '' ||
            responseData === undefined ||
            (typeof responseData === 'object' &&
              responseData !== null &&
              Object.keys(responseData).length === 0)
          ) {
            // Handle 204 No Content or empty object as success
            returnData.push({
              json: {
                success: true,
                id: taskIdForLog,
                action: this.getNodeParameter('markAsAction', i),
              },
              pairedItem: { item: i },
            });
          } else if (
            typeof responseData === 'object' &&
            responseData !== null &&
            (responseData as any).success === true
          ) {
            // Handle explicit success response
            returnData.push({ json: responseData, pairedItem: { item: i } });
          } else if (typeof responseData === 'object' && responseData !== null) {
            // Handle other object responses, potentially indicating success or details
            returnData.push({ json: responseData, pairedItem: { item: i } });
          } else {
            // Fallback for unexpected responses
            this.logger.warn(
              `Unexpected response for ${this.getNodeParameter('markAsAction', i)} task ${taskIdForLog}: ${JSON.stringify(responseData)}`,
            );
            returnData.push({
              json: { success: false, id: taskIdForLog, response: responseData },
              pairedItem: { item: i },
            });
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
