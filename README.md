# n8n-nodes-reclaim-ai

Custom n8n nodes to connect and automate [Reclaim.ai](https://reclaim.ai)

This package provides custom nodes for n8n to interact with the Reclaim.ai API, allowing you to automate task management.

## Features

- Create, read, update, and delete Reclaim.ai tasks
- Support for all task properties: priority, category, time chunks, etc.
- Filter tasks by various criteria

## Installation

### Local Installation (Recommended for Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/labiso-gmbh/n8n-nodes-reclaim-ai.git
   ```
2. Navigate to the project directory:
   ```bash
   cd n8n-nodes-reclaim-ai
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Start n8n with the custom nodes:
   ```bash
   export N8N_CUSTOM_EXTENSIONS=/path/to/n8n-nodes-reclaim-ai/dist
   n8n start
   ```

### Using in Production

To use these nodes in your production n8n instance:

1. Navigate to your n8n installation directory
2. Install the package:
   ```bash
   npm install n8n-nodes-reclaim-ai
   ```
3. Set the environment variable:

   ```bash
   export N8N_CUSTOM_EXTENSIONS=/path/to/node_modules/n8n-nodes-reclaim-ai
   ```

4. Restart your n8n instance

## Usage

After installation, you'll find the "Reclaim.ai Task" node in the n8n nodes panel. Use it to interact with your Reclaim.ai tasks.

### Authentication

1. In n8n, go to Settings > Credentials
2. Create a new "Reclaim.ai API" credential
3. Enter your Reclaim.ai API key

### Creating Tasks

1. Add the "Reclaim.ai Task" node to your workflow
2. Select the "Create" operation
3. Configure the task details (title, priority, etc.)
4. Connect your "Reclaim.ai API" credential
5. Run the workflow

## Development

To modify or extend this package:

1. Make your changes to the source files
2. Run `npm run build` to compile
3. Use `npm run dev` to start n8n with your changes

## Support

If you encounter any issues or have questions, please [create an issue](https://github.com/labiso-gmbh/n8n-nodes-reclaim-ai/issues) on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
