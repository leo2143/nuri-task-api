import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUTH_CAPTURE = (tokenVar) => `const json = pm.response.json();
const cookie = pm.cookies.get('nuri_auth');
const token = cookie || (json && json.data && json.data.token);
if (token) {
  pm.collectionVariables.set('${tokenVar}', token);
}
const baseUrl = pm.collectionVariables.get('baseUrl');
try {
  pm.cookies.jar().unset(baseUrl, 'nuri_auth', function () {});
} catch (e) {}
if (json && json.data && json.data.user && json.data.user._id) {
  pm.collectionVariables.set('${tokenVar === 'adminToken' ? 'adminUserId' : 'demoUserId'}', json.data.user._id);
}
pm.test('Login ok', function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(pm.collectionVariables.get('${tokenVar}')).to.be.ok;
});`;

const SKIP_IF = (varName) => `if (pm.collectionVariables.get('${varName}')) {
  if (typeof pm.execution !== 'undefined' && pm.execution.skipRequest) {
    pm.execution.skipRequest();
  }
}`;

const SAVE_ID = (varName) => `if (pm.response.code === 201 || pm.response.code === 200) {
  const json = pm.response.json();
  const id = json && json.data && json.data._id;
  if (id) {
    pm.collectionVariables.set('${varName}', id);
  }
}
pm.test('Created or already seeded', function () {
  pm.expect([200, 201, 403, 409]).to.include(pm.response.code);
});`;

const SAVE_TITLES = (map) => `const json = pm.response.json();
const items = (json && json.data) || [];
const titles = ${JSON.stringify(map)};
items.forEach(function (item) {
  if (item && item.title && titles[item.title] && item._id) {
    pm.collectionVariables.set(titles[item.title], item._id);
  }
});
pm.test('List ok or empty', function () {
  pm.expect([200, 404]).to.include(pm.response.code);
});`;

function event(listen, exec) {
  return {
    listen,
    script: {
      type: 'text/javascript',
      exec: exec.split('\n'),
    },
  };
}

function url(path, query) {
  const rawQuery = query
    ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&')
    : '';
  return {
    raw: `{{baseUrl}}${path}${rawQuery}`,
    host: ['{{baseUrl}}'],
    path: path.replace(/^\//, '').split('/'),
    ...(query ? { query } : {}),
  };
}

function request({
  name,
  method,
  path,
  authVar,
  body,
  query,
  tests,
  prerequest,
  description,
}) {
  const item = {
    name,
    request: {
      auth: authVar
        ? {
            type: 'bearer',
            bearer: [{ key: 'token', value: `{{${authVar}}}`, type: 'string' }],
          }
        : { type: 'noauth' },
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url: url(path, query),
    },
    response: [],
  };
  if (description) {
    item.request.description = description;
  }
  if (body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
    };
  }
  const events = [];
  if (prerequest) events.push(event('prerequest', prerequest));
  if (tests) events.push(event('test', tests));
  if (events.length) item.event = events;
  return item;
}

function folder(name, items, description) {
  return { name, item: items, ...(description ? { description } : {}) };
}

const GOAL_TITLES = {
  '[Demo] Due today': 'demoGoalDueId',
  '[Demo] Empty goal': 'demoGoalEmptyId',
  '[Demo] Overdue yday': 'demoGoalOverdueId',
  '[Demo] Backlog': 'demoGoalBacklogId',
  '[Demo] Stalled': 'demoGoalStalledId',
  '[Demo] Paused long': 'demoGoalPausedId',
  '[Demo] High prio': 'demoGoalHighId',
  '[Demo] Parent': 'demoGoalParentId',
  '[Demo] Child': 'demoGoalChildId',
  '[Demo] Done': 'demoGoalDoneId',
};

const TODO_TITLES = {
  '[Demo] Task today': 'demoTodoTodayId',
  '[Demo] Task yday': 'demoTodoYdayId',
  '[Demo] Task backlog': 'demoTodoBacklogId',
  '[Demo] Task high': 'demoTodoHighId',
  '[Demo] Task comment': 'demoTodoCommentId',
  '[Demo] Task done': 'demoTodoDoneId',
};

function createGoal(title, varName, extras = {}) {
  return request({
    name: `Create ${title}`,
    method: 'POST',
    path: '/api/goals',
    authVar: 'demoToken',
    body: {
      title,
      description: extras.description || 'Seeded for thesis demo',
      reason: extras.reason || 'Demo',
      priority: extras.priority || 'medium',
      dueDate: extras.dueDate || '{{dueToday}}',
      ...(extras.parentGoalId ? { parentGoalId: extras.parentGoalId } : {}),
    },
    prerequest: SKIP_IF(varName),
    tests: SAVE_ID(varName),
  });
}

function createTodo(title, varName, extras = {}) {
  return request({
    name: `Create ${title}`,
    method: 'POST',
    path: '/api/todos',
    authVar: 'demoToken',
    body: {
      title,
      description: extras.description || 'Seeded for thesis demo',
      priority: extras.priority || 'medium',
      dueDate: extras.dueDate || '{{dueToday}}',
      completed: false,
      ...(extras.GoalId ? { GoalId: extras.GoalId } : {}),
    },
    prerequest: SKIP_IF(varName),
    tests: SAVE_ID(varName),
  });
}

function fire(name, path) {
  return request({
    name,
    method: 'POST',
    path,
    authVar: 'adminToken',
    tests: `pm.test('Job ran', function () {
  pm.expect(pm.response.code).to.eql(200);
});`,
  });
}

const collection = {
  info: {
    _postman_id: 'a8f3c2e1-7b4d-4c9a-9e21-6d2c8f0b1a44',
    name: 'Nuri Demo Seed',
    description: [
      'Seeds a professor demo account and fires notification jobs for the thesis defense.',
      '',
      'Before Run Collection:',
      '1. Set collection variables adminEmail and adminPassword (your admin).',
      '2. Keep demoEmail / demoPassword as-is, or change them if you already seeded.',
      '3. Point baseUrl at local or a dedicated demo database.',
      '4. Do NOT run folders 03/07 against production with real users: jobs notify every matching account.',
      '5. In Runner, use a 300ms delay if login hits 429.',
      '',
      'What it creates (professor, free then promoted):',
      '- 2 free goals (due today + empty) then premium-nag + due/empty/day-recap',
      '- After promote: overdue, backlog, stalled, paused, high-priority, parent/child, completed + comment',
      '- seed-clock rewinds only [Demo] documents so crons match yesterday / 8d / 15d',
      '',
      'Give professors demoEmail / demoPassword. They land verified, past onboarding, with seeded data.',
      'Wave 1 stays in their inbox (clean only clears the admin inbox).',
      'Do not fire inactivity / streak-risk here: those need real lastLogin / streak, not fake clocks.',
      'Re-run is idempotent on titles: existing [Demo] docs are reused, not duplicated.',
    ].join('\n'),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [
    event(
      'prerequest',
      `function artDue(offsetDays) {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const parts = ymd.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offsetDays, 12, 0, 0)).toISOString();
}
pm.collectionVariables.set('dueToday', artDue(0));
pm.collectionVariables.set('dueTomorrow', artDue(1));
pm.collectionVariables.set('dueInFourDays', artDue(4));`
    ),
  ],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'adminEmail', value: '' },
    { key: 'adminPassword', value: '' },
    { key: 'demoEmail', value: 'nuri.demo.profesor@nuri-task.invalid' },
    { key: 'demoPassword', value: 'DemoNuri2026!' },
    { key: 'adminToken', value: '' },
    { key: 'demoToken', value: '' },
    { key: 'adminUserId', value: '' },
    { key: 'demoUserId', value: '' },
    { key: 'dueToday', value: '' },
    { key: 'dueTomorrow', value: '' },
    { key: 'dueInFourDays', value: '' },
    ...Object.values(GOAL_TITLES).map((key) => ({ key, value: '' })),
    ...Object.values(TODO_TITLES).map((key) => ({ key, value: '' })),
  ],
  item: [
    folder('00 Auth admin', [
      request({
        name: 'Login admin',
        method: 'POST',
        path: '/api/users/login',
        body: {
          email: '{{adminEmail}}',
          password: '{{adminPassword}}',
        },
        tests: AUTH_CAPTURE('adminToken'),
        description: 'Captures nuri_auth cookie into adminToken and unsets the cookie so later Bearer calls are not overridden.',
      }),
    ], 'Uses your existing admin. Fill adminEmail / adminPassword first.'),
    folder('01 Provision professor', [
      request({
        name: 'Create professor',
        method: 'POST',
        path: '/api/admin/users',
        authVar: 'adminToken',
        body: {
          name: 'Profesor Demo',
          email: '{{demoEmail}}',
          password: '{{demoPassword}}',
          isAdmin: false,
          isSubscribed: false,
        },
        tests: `if (pm.response.code === 201) {
  const json = pm.response.json();
  if (json.data && json.data._id) {
    pm.collectionVariables.set('demoUserId', json.data._id);
  }
}
pm.test('Created or already exists', function () {
  pm.expect([201, 409]).to.include(pm.response.code);
});`,
        description: 'Admin-created users are emailVerified and skip onboarding so professors can log in immediately.',
      }),
      request({
        name: 'Resolve professor',
        method: 'GET',
        path: '/api/users',
        authVar: 'adminToken',
        query: [
          { key: 'search', value: '{{demoEmail}}' },
          { key: 'limit', value: '5' },
        ],
        tests: `const json = pm.response.json();
const users = (json && json.data) || [];
const email = (pm.collectionVariables.get('demoEmail') || '').toLowerCase();
const found = users.find(function (user) {
  return user.email && user.email.toLowerCase() === email;
});
if (found && found._id) {
  pm.collectionVariables.set('demoUserId', found._id);
}
pm.test('Professor resolved', function () {
  pm.expect(pm.collectionVariables.get('demoUserId')).to.be.ok;
});`,
      }),
      request({
        name: 'Login professor',
        method: 'POST',
        path: '/api/users/login',
        body: {
          email: '{{demoEmail}}',
          password: '{{demoPassword}}',
        },
        tests: AUTH_CAPTURE('demoToken'),
      }),
    ], 'Creates a free, verified professor. 409 on re-run is expected.'),
    folder('02 Seed free (2 goals)', [
      request({
        name: 'List existing demo goals',
        method: 'GET',
        path: '/api/goals',
        authVar: 'demoToken',
        query: [
          { key: 'search', value: 'Demo' },
          { key: 'limit', value: '50' },
        ],
        tests: SAVE_TITLES(GOAL_TITLES),
      }),
      request({
        name: 'List existing demo todos',
        method: 'GET',
        path: '/api/todos',
        authVar: 'demoToken',
        query: [
          { key: 'search', value: 'Demo' },
          { key: 'limit', value: '50' },
        ],
        tests: SAVE_TITLES(TODO_TITLES),
      }),
      createGoal('[Demo] Due today', 'demoGoalDueId', {
        description: 'Has a task due today',
        reason: 'Show due today',
      }),
      createTodo('[Demo] Task today', 'demoTodoTodayId', {
        GoalId: '{{demoGoalDueId}}',
        dueDate: '{{dueToday}}',
      }),
      createGoal('[Demo] Empty goal', 'demoGoalEmptyId', {
        description: 'No first step yet',
        reason: 'Show empty nag',
      }),
    ], 'Free plan ceiling is 2 goals. This is the state premium-nag needs.'),
    folder('03 Fire wave 1', [
      fire('Clean admin inbox', '/api/admin/demo/notifications/clean'),
      fire('premium-nag', '/api/admin/demo/notifications/premium-nag'),
      fire('due-tasks', '/api/admin/demo/notifications/due-tasks'),
      fire('due-goals', '/api/admin/demo/notifications/due-goals'),
      fire('empty-goals', '/api/admin/demo/notifications/empty-goals'),
      fire('day-recap', '/api/admin/demo/notifications/day-recap'),
    ], 'Hits every matching user. Professor keeps these; clean only wipes the admin inbox.'),
    folder('04 Promote professor', [
      request({
        name: 'Grant 30-day subscription',
        method: 'PUT',
        path: '/api/admin/users/{{demoUserId}}',
        authVar: 'adminToken',
        body: {
          isSubscribed: true,
        },
        tests: `pm.test('Promoted', function () {
  pm.expect(pm.response.code).to.eql(200);
});`,
        description: 'Admin grant. No Mercado Pago id. After this the professor can create more than 2 goals.',
      }),
    ]),
    folder('05 Seed full catalog', [
      createGoal('[Demo] Overdue yday', 'demoGoalOverdueId', {
        description: 'Clock will move this to yesterday',
        reason: 'Overdue demo',
        dueDate: '{{dueTomorrow}}',
      }),
      createTodo('[Demo] Task yday', 'demoTodoYdayId', {
        GoalId: '{{demoGoalOverdueId}}',
        dueDate: '{{dueTomorrow}}',
      }),
      createGoal('[Demo] Backlog', 'demoGoalBacklogId', {
        description: 'Clock will move this to -8 days',
        reason: 'Backlog demo',
        dueDate: '{{dueTomorrow}}',
      }),
      createTodo('[Demo] Task backlog', 'demoTodoBacklogId', {
        GoalId: '{{demoGoalBacklogId}}',
        dueDate: '{{dueTomorrow}}',
      }),
      createGoal('[Demo] Stalled', 'demoGoalStalledId', {
        description: 'Clock will age lastChildActivity',
        reason: 'Stalled demo',
      }),
      createGoal('[Demo] Paused long', 'demoGoalPausedId', {
        description: 'Will be paused then clocked to -15 days',
        reason: 'Pause demo',
      }),
      request({
        name: 'Pause [Demo] Paused long',
        method: 'PATCH',
        path: '/api/goals/{{demoGoalPausedId}}/status',
        authVar: 'demoToken',
        body: { status: 'paused' },
        tests: `pm.test('Paused or already paused', function () {
  pm.expect([200, 400]).to.include(pm.response.code);
});`,
      }),
      createGoal('[Demo] High prio', 'demoGoalHighId', {
        description: 'Important work in progress',
        reason: 'High prio demo',
        priority: 'high',
        dueDate: '{{dueInFourDays}}',
      }),
      createTodo('[Demo] Task high', 'demoTodoHighId', {
        GoalId: '{{demoGoalHighId}}',
        priority: 'high',
        dueDate: '{{dueInFourDays}}',
      }),
      createGoal('[Demo] Parent', 'demoGoalParentId', {
        description: 'Parent with a child goal',
        reason: 'Hierarchy demo',
      }),
      createGoal('[Demo] Child', 'demoGoalChildId', {
        description: 'Child of parent',
        reason: 'Hierarchy demo',
        parentGoalId: '{{demoGoalParentId}}',
      }),
      createGoal('[Demo] Done', 'demoGoalDoneId', {
        description: 'Completed during seed',
        reason: 'Complete demo',
      }),
      createTodo('[Demo] Task done', 'demoTodoDoneId', {
        GoalId: '{{demoGoalDoneId}}',
      }),
      request({
        name: 'Complete [Demo] Task done',
        method: 'PATCH',
        path: '/api/todos/{{demoTodoDoneId}}/state',
        authVar: 'demoToken',
        body: { completed: true },
        tests: `pm.test('Task completed', function () {
  pm.expect([200, 400]).to.include(pm.response.code);
});`,
      }),
      request({
        name: 'Complete [Demo] Done',
        method: 'PATCH',
        path: '/api/goals/{{demoGoalDoneId}}/status',
        authVar: 'demoToken',
        body: { status: 'completed' },
        tests: `pm.test('Goal completed', function () {
  pm.expect([200, 400]).to.include(pm.response.code);
});`,
      }),
      createTodo('[Demo] Task comment', 'demoTodoCommentId', {
        GoalId: '{{demoGoalParentId}}',
        description: 'Receives a comment',
      }),
      request({
        name: 'Comment on [Demo] Task comment',
        method: 'POST',
        path: '/api/todos/{{demoTodoCommentId}}/comments',
        authVar: 'demoToken',
        body: { text: 'Demo comment so professors can see the thread' },
        tests: `pm.test('Comment added', function () {
  pm.expect([200, 201]).to.include(pm.response.code);
});`,
      }),
    ], 'Covers overdue, backlog, stalled, pause, high priority, parent/child, complete, and comments.'),
    folder('06 Seed clock', [
      request({
        name: 'Rewind [Demo] dates',
        method: 'POST',
        path: '/api/admin/demo/seed-clock',
        authVar: 'adminToken',
        body: { userId: '{{demoUserId}}' },
        tests: `pm.test('Clock applied', function () {
  pm.expect(pm.response.code).to.eql(200);
});`,
        description: 'Only patches titles that start with [Demo] for this userId. Public APIs cannot create past due dates.',
      }),
    ]),
    folder('07 Fire wave 2', [
      fire('Clean admin inbox', '/api/admin/demo/notifications/clean'),
      fire('pause-too-long', '/api/admin/demo/notifications/pause-too-long'),
      fire('stalled-goals', '/api/admin/demo/notifications/stalled-goals'),
      fire('overdue-backlog', '/api/admin/demo/notifications/overdue-backlog'),
      fire('overdue-tasks', '/api/admin/demo/notifications/overdue-tasks'),
      fire('overdue-goals', '/api/admin/demo/notifications/overdue-goals'),
      fire('high-priority', '/api/admin/demo/notifications/high-priority'),
      fire('high-priority-goals', '/api/admin/demo/notifications/high-priority-goals'),
      fire('moodboard-nudge', '/api/admin/demo/notifications/moodboard-nudge'),
    ], 'Fire backlog before overdue so both can land the same day. Skip inactivity and streak-risk.'),
    folder('08 Verify inbox', [
      request({
        name: 'Professor notifications',
        method: 'GET',
        path: '/api/notifications',
        authVar: 'demoToken',
        query: [{ key: 'limit', value: '50' }],
        tests: `const json = pm.response.json();
const items = (json && json.data) || [];
console.log('Professor inbox count:', items.length);
items.forEach(function (item) {
  console.log((item.type || '') + ' — ' + (item.title || ''));
});
pm.test('Inbox readable', function () {
  pm.expect([200, 404]).to.include(pm.response.code);
});`,
        description: 'Sanity check after Run Collection. Login as the professor in the app to walk the same inbox.',
      }),
    ]),
  ],
};

const out = join(dirname(fileURLToPath(import.meta.url)), 'nuri-demo-seed.postman_collection.json');
writeFileSync(out, JSON.stringify(collection, null, 2) + '\n', 'utf8');
console.log('Wrote', out);
