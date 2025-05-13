# n8n-nodes-reclaim-ai

**Developed by [LABISO GmbH](https://www.labiso.de)**

This repository contains a custom n8n node designed to integrate with [Reclaim.ai](https://reclaim.ai), an intelligent task management and calendar blocking service. Reclaim.ai helps you automatically find the best time for your tasks, habits, and meetings, ensuring your schedule is optimized and productive.

This n8n connector allows you to seamlessly automate your Reclaim.ai workflows, bringing the power of intelligent scheduling into your n8n automations.

Contributions to this project are welcome! Please feel free to submit pull requests or open issues.

## Features & Capabilities

The Reclaim.ai Task node provides the following operations:

- **Create Task**:
  - Define new tasks with comprehensive details:
    - Title (required)
    - Time Schedule (required, dynamically loaded from your Reclaim.ai account)
    - Event Category (required: Work, Personal)
    - Priority (required: P1 - Urgent, P2 - High, P3 - Medium, P4 - Low)
    - Duration (required, in minutes, e.g., 15, 30, 45)
    - Minimum Chunk Size (required, in minutes)
    - Maximum Chunk Size (required, in minutes)
    - Always Private (required, boolean)
    - Up Next (On Deck) (required, boolean)
    - Notes (optional)
    - Due Date (optional, UTC ISO 8601 format)
    - Snooze Until (optional, UTC ISO 8601 format)
    - Event Color (optional, e.g., #FF0000 or "blue")
- **Get Task**:
  - Retrieve a specific task by its unique Task ID.
- **Update Task**:
  - Modify an existing task using its Task ID. You can update any of the fields available during task creation. At least one field must be provided for an update.
- **Delete Task**:
  - Remove a task from Reclaim.ai using its Task ID.
- **Get All Tasks**:
  - Fetch a list of all your tasks.
  - Filter tasks by status (e.g., NEW, SCHEDULED, IN_PROGRESS, COMPLETE, ARCHIVED, CANCELLED).
- **Mark Task as**:
  - Mark a specific task as "Done" or "To Do" using its Task ID.

## Installation

You can install these nodes in your n8n instance in a couple of ways:

### Community Nodes (Recommended for most users)

Once this package is published to npm, you should be able to install it directly from the n8n UI:

1.  Go to **Settings > Community Nodes**.
2.  Click **Install a community node**.
3.  Enter `n8n-nodes-reclaim-ai` and click **Install**.

### Manual Installation / Development

1.  Clone this repository:
    ```bash
    git clone https://github.com/labiso-gmbh/n8n-nodes-reclaim-ai.git # Or your fork
    cd n8n-nodes-reclaim-ai
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  Link the package to your n8n custom extensions directory.
    If n8n is installed globally:

    ```bash
    npm link
    # In your n8n user folder (e.g., ~/.n8n or the directory where n8n stores its data)
    mkdir -p custom-nodes
    cd custom-nodes
    npm link n8n-nodes-reclaim-ai
    ```

    Alternatively, set the `N8N_CUSTOM_EXTENSIONS` environment variable to point to the `dist` folder of this project:

    ```bash
    export N8N_CUSTOM_EXTENSIONS=/path/to/n8n-nodes-reclaim-ai
    ```

    (Ensure you use the absolute path to the `n8n-nodes-reclaim-ai` directory, not the `dist` folder itself if you are not using `npm link` for the `dist` folder directly).

5.  Restart your n8n instance.

## Usage

After successful installation, the "Reclaim.ai Task" node will appear in your n8n nodes panel, typically under the "Action" category.

### Authentication

1.  In n8n, navigate to the **Credentials** section.
2.  Click **Add credential**.
3.  Search for "Reclaim.ai API" and select it.
4.  Enter your Reclaim.ai API key. You can usually find or generate this in your Reclaim.ai account settings.
5.  Save the credential.

### Configuring the Node

1.  Drag the "Reclaim.ai Task" node onto your workflow canvas.
2.  Select the desired **Operation** (e.g., Create, Get, Update, Delete, Get All).
3.  Based on the selected operation, fill in the required and optional fields.
    - For operations requiring a **Task ID** (Get, Update, Delete, Mark Task as), ensure you provide a valid ID.
    - For **Create** and **Update**, carefully configure the task properties.
    - For **Get All**, you can use the **Status** filter to narrow down results.
    - For **Mark Task as**, select whether to mark the task as "Done" or "To Do".
4.  Select your configured "Reclaim.ai API" credential from the **Credential** dropdown.
5.  Connect the node to your workflow and run it.

## Development

If you wish to contribute or modify this package:

1.  Ensure you have Node.js and npm installed.
2.  Clone the repository and install dependencies as described in the "Manual Installation" section.
3.  Make your changes to the source files (primarily in the `nodes` and `credentials` directories).
4.  Rebuild the project after making changes:
    ```bash
    npm run build
    ```
5.  To continuously build during development:
    ```bash
    npm run dev
    ```
    This will watch for changes and rebuild automatically. You'll still need to restart n8n or have it configured to pick up changes in your custom nodes directory.

## Support

If you encounter any issues, have questions, or want to suggest improvements, please [create an issue](https://github.com/labiso-gmbh/n8n-nodes-reclaim-ai/issues) on the GitHub repository.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
