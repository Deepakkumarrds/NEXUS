const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://localhost:5000/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '6a2f9542fb4d6fbae2d030c0',
      title: 'Test Task 3',
      description: '',
      assigned_to: '',
      priority: 'Medium',
      due_date: '',
      is_recurring: false,
      recurrence_pattern: 'Weekly',
      recurrence_end: '',
      sow_id: '',
      sow_item_id: ''
    })
  });
  console.log(res.status, await res.text());
}
run();
