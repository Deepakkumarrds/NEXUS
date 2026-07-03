const fs = require('fs');
const path = require('path');
const schemaPath = path.join(process.cwd(), 'backend', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Update datasource
content = content.replace(/provider\s*=\s*"mongodb"/, 'provider = "postgresql"');
if (!content.includes('directUrl')) {
    content = content.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
}

// 2. Replace @id fields
content = content.replace(/@id\s+@default\(auto\(\)\)\s+@map\("_id"\)\s+@db\.ObjectId/g, '@id @default(uuid()) @db.Uuid');

// 3. Replace all remaining @db.ObjectId with @db.Uuid
content = content.replace(/@db\.ObjectId/g, '@db.Uuid');

// 4. Any standalone @map("_id") left?
content = content.replace(/@map\("_id"\)/g, '');

fs.writeFileSync(schemaPath, content);
console.log('Schema migrated successfully');
