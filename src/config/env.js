function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function loadConfig() {
  const config = {
    appName: getEnv('APP_NAME', 'CampusConnect Africa'),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    port: Number(getEnv('PORT', 3000)),
    databaseUrl: getEnv('DATABASE_URL', ''),
    databaseSsl: getEnv('DATABASE_SSL', 'false') === 'true',
  };

  return {
    ...config,
    databaseConfigured: Boolean(config.databaseUrl),
  };
}

module.exports = { loadConfig };
