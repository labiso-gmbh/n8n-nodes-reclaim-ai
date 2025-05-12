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
        required: true,
      },
      // The 'type' field (TASK, HABIT, etc.) is removed as it's not part of the /api/tasks POST request body schema.
      // {
      //   displayName: 'Type',
      //   name: 'type',
      //   type: 'options',
      //   displayOptions: {
      //     show: { operation: ['create', 'update'] },
      //   },
      //   default: 'TASK',
      //   options: [
      //     // From API Spec
      //     { name: 'Task', value: 'TASK' },
      //     { name: 'Habit', value: 'HABIT' },
      //     { name: 'Buffer', value: 'BUFFER' },
      //     { name: 'One-on-One', value: 'ONE_ON_ONE' },
      //   ],
      //   description: 'Type of the task',
      // },
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
        default: 'P2', // User-facing default
        options: [
          // User-facing values, will be mapped to API values (P1-P4)
          { name: 'Urgent', value: 'P4' },
          { name: 'High', value: 'P3' },
          { name: 'Medium', value: 'P2' },
          { name: 'Low', value: 'P1' },
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
          show: { operation: ['create', 'update'] },
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
        displayName: 'Minimum Chunk Size',
        name: 'minChunkSize',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 1, // Default to 1 chunk (15 min)
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Minimum number of 15-min chunks for task sessions.',
        required: true,
      },
      {
        displayName: 'Maximum Chunk Size',
        name: 'maxChunkSize',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 6, // Default to 6 chunks (1.5 hours)
        displayOptions: {
          show: { operation: ['create', 'update'] },
        },
        description: 'Maximum number of 15-min chunks for task sessions.',
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
          body.minChunkSize = this.getNodeParameter('minChunkSize', i, 2) as number;
          body.maxChunkSize = this.getNodeParameter('maxChunkSize', i, 16) as number;

          // Optional fields
          const due = this.getNodeParameter('due', i) as string;
          if (due) body.due = due;
          const snoozeUntil = this.getNodeParameter('snoozeUntil', i) as string;
          if (snoozeUntil) body.snoozeUntil = snoozeUntil;

          // New properties for create
          const eventColor = this.getNodeParameter('eventColor', i, '') as string;
          if (eventColor) body.eventColor = eventColor;
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
            // Always include required fields for update operation
            body.eventCategory = this.getNodeParameter('eventCategory', i, 'WORK') as string;

            // Required field - priority
            const priorityFromNodeUpdate = this.getNodeParameter('priority', i, 'MEDIUM') as string;
            const priorityMapUpdate: { [key: string]: string } = {
              URGENT: 'P1',
              HIGH: 'P2',
              MEDIUM: 'P3',
              LOW: 'P4',
            };
            body.priority = priorityMapUpdate[priorityFromNodeUpdate.toUpperCase()] || 'P3';

            // Required fields - minChunkSize and maxChunkSize
            body.minChunkSize = this.getNodeParameter('minChunkSize', i, 1) as number;
            body.maxChunkSize = this.getNodeParameter('maxChunkSize', i, 6) as number;

            // Required field - alwaysPrivate
            body.alwaysPrivate = this.getNodeParameter('alwaysPrivate', i, false) as boolean;

            // Required field - onDeck
            body.onDeck = this.getNodeParameter('onDeck', i, false) as boolean;

            // For update, include provided fields
            const title = this.getNodeParameter('title', i, null) as string | null;
            if (title !== null) body.title = title;

            const notes = this.getNodeParameter('notes', i, null) as string | null;
            if (notes !== null) body.notes = notes;

            // Convert minutes to timeChunksRequired
            const duration = this.getNodeParameter('duration', i, null) as number | null;
            if (duration !== null) {
              body.timeChunksRequired = Math.ceil(duration / 15);
            } else {
              // Default to 4 chunks (1 hour) if not provided
              body.timeChunksRequired = 4;
            }

            const due = this.getNodeParameter('due', i, null) as string | null;
            if (due !== null) body.due = due;

            const snoozeUntil = this.getNodeParameter('snoozeUntil', i, null) as string | null;
            if (snoozeUntil !== null) body.snoozeUntil = snoozeUntil;

            const eventColor = this.getNodeParameter('eventColor', i, null) as string | null;
            if (eventColor === '') {
              body.eventColor = null;
            } else if (eventColor !== null) {
              body.eventColor = eventColor;
            }

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

        this.logger.debug(
          `Reclaim.ai API Request Options for operation '${operation}': ${JSON.stringify(options, null, 2)}`,
        );

        if (method === 'POST' || method === 'PATCH') {
          options.body = body;
        }
        if (method === 'GET' && Object.keys(qs).length > 0) {
          options.qs = qs;
        }

        this.logger.debug('Request body:', { body });
        this.logger.debug('Request query string:', { qs });

        const responseData = await this.helpers.httpRequest(options);

        this.logger.debug('Response data:', { responseData });

        const taskIdForLog =
          operation === 'delete' || operation === 'update' || operation === 'get'
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
