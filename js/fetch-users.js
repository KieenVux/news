document.addEventListener('DOMContentLoaded', function () {
  var button = document.getElementById('fetch-users-button');
  var status = document.getElementById('fetch-users-status');
  var output = document.getElementById('fetch-users-output');

  if (!button || !status || !output) {
    return;
  }

  button.addEventListener('click', async function () {
    button.disabled = true;
    status.textContent = 'Loading users...';
    output.textContent = '';

    try {
      var response = await fetch('/api/users');
      var payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch users');
      }

      status.textContent = 'Loaded ' + payload.count + ' users';
      output.textContent = JSON.stringify(payload.users, null, 2);
    } catch (error) {
      status.textContent = 'Request failed';
      output.textContent = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      button.disabled = false;
    }
  });
});
