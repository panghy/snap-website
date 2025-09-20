#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ allErrors: true, strict: false });

// Read the schema
const schemaPath = path.join(__dirname, '../specs/001-build-a-catalogue/contracts/snaps-schema.json');
const dataPath = path.join(__dirname, '../src/data/snaps.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Validate
const validate = ajv.compile(schema);
const valid = validate(data);

if (!valid) {
  console.error('❌ JSON validation failed:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
} else {
  console.log('✅ snaps.json is valid according to the schema');
}