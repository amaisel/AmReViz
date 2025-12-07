import { TodoistApi } from '@doist/todoist-api-typescript';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=todoist',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Todoist not connected');
  }
  return accessToken;
}

async function getUncachableTodoistClient() {
  const token = await getAccessToken();
  return new TodoistApi(token);
}

async function findTaskAndSubtasks() {
  const api = await getUncachableTodoistClient();
  
  const tasksResponse = await api.getTasks();
  const tasks = Array.isArray(tasksResponse) ? tasksResponse : tasksResponse.results || [];
  
  const targetTask = tasks.find(task => 
    task.content.toLowerCase().includes('visualize am rev')
  );
  
  if (!targetTask) {
    console.log('Task "Visualize AmRev" not found.');
    console.log('\nAvailable tasks:');
    tasks.forEach(task => {
      console.log(`- ${task.content}`);
    });
    return;
  }
  
  console.log('=== Task Found ===');
  console.log(`Task: ${targetTask.content}`);
  console.log(`Description: ${targetTask.description || '(No description)'}`);
  console.log(`Priority: ${targetTask.priority}`);
  console.log(`Due: ${targetTask.due ? targetTask.due.string : '(No due date)'}`);
  console.log(`Task ID: ${targetTask.id}`);
  
  const subtasks = tasks.filter(task => task.parentId === targetTask.id);
  
  if (subtasks.length > 0) {
    console.log('\n=== Subtasks ===');
    subtasks.forEach((subtask, index) => {
      console.log(`\n${index + 1}. ${subtask.content}`);
      if (subtask.description) {
        console.log(`   Description: ${subtask.description}`);
      }
      if (subtask.due) {
        console.log(`   Due: ${subtask.due.string}`);
      }
    });
  } else {
    console.log('\n(No subtasks found)');
  }
}

findTaskAndSubtasks().catch(console.error);
