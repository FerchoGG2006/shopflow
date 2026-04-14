const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_ucao01VkTZel@ep-mute-haze-ami2poy0-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  const result = await sql`SELECT slug FROM businesses LIMIT 5`;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
