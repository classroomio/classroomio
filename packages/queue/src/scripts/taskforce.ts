import 'dotenv/config';
import { exec } from 'child_process';
import { queueEnv } from '../config/env';

if (!queueEnv.TASKFORCE_TOKEN) {
  console.error('TASKFORCE_TOKEN is required. Get your token from https://taskforce.sh');
  process.exit(1);
}

const connectionName = queueEnv.TASKFORCE_CONNECTION_NAME || 'classroomio-local';
const redisUri = queueEnv.REDIS_URL || 
  `redis://${queueEnv.REDIS_PASSWORD ? `:${queueEnv.REDIS_PASSWORD}@` : ''}${queueEnv.REDIS_HOST || 'localhost'}:${queueEnv.REDIS_PORT || 6379}/${queueEnv.REDIS_DB || 0}`;

let args = `-n "${connectionName}" -t "${queueEnv.TASKFORCE_TOKEN}" --uri "${redisUri}"`;

// Manually specify queues to avoid SCAN TYPE issues with older Redis versions
const queues = queueEnv.TASKFORCE_QUEUES || 'email,video';
args += ` --queues ${queues}`;

if (queueEnv.TASKFORCE_TEAM) {
  args += ` --team "${queueEnv.TASKFORCE_TEAM}"`;
}

console.log('Starting Taskforce connector...');
console.log('View your queues at: https://taskforce.sh');

const connector = exec(`pnpx taskforce-connector ${args}`, (error) => {
  if (error) {
    console.error('Taskforce connector error:', error.message);
    process.exit(1);
  }
});

connector.stdout?.on('data', (data) => {
  console.log(data.toString());
});

connector.stderr?.on('data', (data) => {
  console.error(data.toString());
});

process.on('SIGINT', () => {
  connector.kill();
  process.exit(0);
});



