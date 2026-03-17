import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function formatErrorMessage(error, tableName) {
  if (!error) {
    return 'Unknown error';
  }

  var code = error.code || '';
  var message = error.message || 'Unknown error';
  var hint = error.hint ? '\nHint: ' + error.hint : '';
  var details = error.details ? '\nDetails: ' + error.details : '';

  if (message.indexOf('Invalid API key') !== -1) {
    return 'Invalid API key\nCheck window.SUPABASE_CONFIG.anonKey in index.html and make sure it belongs to this Supabase project.';
  }

  if (code === 'PGRST205') {
    return 'Wrong table name\nSupabase could not find table `' + tableName + '` in the schema cache.' + hint + details;
  }

  if (code === '42501' || message.toLowerCase().indexOf('permission denied') !== -1) {
    return 'RLS blocked or permission denied\nYour anon key does not have select access to `' + tableName + '`.' + hint + details;
  }

  return message + hint + details;
}

function formatEmptyMessage(tableName) {
  return (
    '0 visible rows\n' +
    'The anon client received an empty result from `' + tableName + '`.\n' +
    'This usually means one of two things:\n' +
    '1. The table really has 0 rows.\n' +
    '2. RLS is enabled and the current anon policy filters out all rows.\n' +
    'Frontend-only code cannot distinguish those two cases reliably without a privileged backend.'
  );
}

document.addEventListener('DOMContentLoaded', function () {
  var button = document.getElementById('fetch-users-button');
  var status = document.getElementById('fetch-users-status');
  var output = document.getElementById('fetch-users-output');
  var config = window.SUPABASE_CONFIG || {};
  var supabaseUrl = config.url || 'https://gjhjdyfysbszyhkksqhh.supabase.co';
  var supabaseAnonKey = config.anonKey || '';
  var tableName = config.table || 'News';

  if (!button || !status || !output) {
    return;
  }

  if (!supabaseAnonKey) {
    status.textContent = 'Missing Supabase anon key';
    output.textContent = 'Set window.SUPABASE_CONFIG.anonKey in index.html before using this button.';
    button.disabled = true;
    return;
  }

  var supabase = createClient(supabaseUrl, supabaseAnonKey);

  button.addEventListener('click', async function () {
    button.disabled = true;
    status.textContent = 'Loading news...';
    output.textContent = '';

    try {
      var result = await supabase
        .from(tableName)
        .select('*');

      if (result.error) {
        throw result.error;
      }

      if (!result.data || result.data.length === 0) {
        status.textContent = '0 visible rows';
        output.textContent = formatEmptyMessage(tableName);
        return;
      }

      status.textContent = 'Loaded ' + result.data.length + ' rows from ' + tableName;
      output.textContent = JSON.stringify(result.data, null, 2);
    } catch (error) {
      status.textContent = 'Request failed';
      output.textContent = formatErrorMessage(error, tableName);
    } finally {
      button.disabled = false;
    }
  });
});
