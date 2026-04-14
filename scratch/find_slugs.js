const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_ucao01VkTZel@ep-mute-haze-ami2poy0-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query('SELECT slug FROM businesses LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
