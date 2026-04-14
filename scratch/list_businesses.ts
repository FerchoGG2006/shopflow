import { db } from './src/lib/db';
import { businesses } from './src/db/schema';

async function listBusinesses() {
  const result = await db.select().from(businesses);
  console.log(JSON.stringify(result, null, 2));
}

listBusinesses().catch(console.error);
