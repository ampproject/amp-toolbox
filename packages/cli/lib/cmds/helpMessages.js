module.exports = {
  'main': [
    'amp [command] <options>',
    '',
    '',
    'curls ..................... generate AMP cache URL(s)',
    'help ...................... show this menu',
    'lint ...................... checks document for errors',
    'optimize .................. runs AMP Optimizer for a given URL or file',
    'runtime-version ........... shows the current AMP runtime version [production]',
    'update-cache .............. removes documents from the AMP Caches',
    'version ................... shows the current AMP Toolbox version',
  ].join('\n'),
  'update-cache': [
    'Usage:',
    '',
    '',
    'amp update-cache [url] <options>',
    '',
    '',
    'Options:',
    "--privateKey .............. path to the private key file. Defaults to './privateKey.pem'.",
  ].join('\n'),
  'lint': ['Usage:', '', '', 'amp lint url', '', 'Examples:', '  $ amplint https://amp.dev/'].join(
    '\n'
  ),
  'runtime-version': ['Usage:', '', '', 'amp runtime-version'].join('\n'),
  'curls': [
    'Usage:',
    '',
    '',
    'amp curls [url] <options>',
    '',
    '',
    'Options:',
    '--cache ................... AMP cache id as specified here: https://cdn.ampproject.org/caches.json.',
  ].join('\n'),
  'optimize': ['Usage:', '', '', 'amp optimize [url|file]'].join('\n'),
};
