#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[key] = value;
  }
  return args;
}

function readEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function getCredentials(args) {
  const cwd = process.cwd();
  const fileEnv = {
    ...readEnvFile(path.join(cwd, ".env")),
    ...readEnvFile(path.join(cwd, "backend/.env")),
    ...readEnvFile(path.join(cwd, "mobile/.env")),
  };
  return {
    url: args.url || process.env.SUPABASE_URL || fileEnv.SUPABASE_URL || "",
    serviceKey:
      args["service-key"] ||
      process.env.SUPABASE_SECRET_KEY ||
      fileEnv.SUPABASE_SECRET_KEY ||
      "",
  };
}

function jsonHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: "application/json",
  };
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  const contentType = response.headers.get("content-type") || "";
  let body;

  if (contentType.includes("application/json") || contentType.includes("+json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function compactTable(table) {
  return {
    id: table.id ?? null,
    schema: table.schema ?? null,
    name: table.name ?? null,
    kind: table.comment ? "table_or_view" : null,
    rls_enabled:
      table.rls_enabled ??
      table.is_rls_enabled ??
      table.replica_identity ??
      null,
    bytes: table.bytes ?? null,
    size: table.size ?? null,
    comment: table.comment ?? null,
    primary_keys: table.primary_keys ?? null,
  };
}

function columnKey(column) {
  return `${column.schema || ""}.${column.table || column.table_name || ""}.${column.name || column.column_name || ""}`;
}

function summarizeRelationships(relationships) {
  return (relationships || []).map((rel) => ({
    table: rel.table ?? rel.source_table_name ?? null,
    schema: rel.schema ?? rel.source_schema ?? null,
    column: rel.column ?? rel.source_column_name ?? null,
    referenced_table: rel.foreign_table ?? rel.target_table_name ?? null,
    referenced_schema: rel.foreign_schema ?? rel.target_schema ?? null,
    referenced_column: rel.foreign_column ?? rel.target_column_name ?? null,
    constraint_name: rel.foreign_key_name ?? rel.constraint_name ?? null,
  }));
}

function summarizePolicies(policies) {
  return (policies || []).map((policy) => ({
    schema: policy.schema ?? null,
    table: policy.table ?? null,
    name: policy.name ?? policy.policy_name ?? null,
    action: policy.action ?? policy.command ?? null,
    roles: policy.roles ?? null,
    permissive: policy.permissive ?? null,
    using: policy.definition ?? policy.qual ?? policy.using ?? null,
    check: policy.check ?? policy.with_check ?? null,
  }));
}

function summarizeFunctions(functions) {
  return (functions || []).map((fn) => ({
    schema: fn.schema ?? null,
    name: fn.name ?? null,
    args: fn.args ?? fn.arguments ?? null,
    return_type: fn.return_type ?? null,
    language: fn.language ?? null,
    behavior: fn.behavior_type ?? null,
    security_definer: fn.security_definer ?? null,
  }));
}

function summarizeTriggers(triggers) {
  return (triggers || []).map((trigger) => ({
    schema: trigger.schema ?? null,
    table: trigger.table ?? null,
    name: trigger.name ?? null,
    function_name: trigger.function_name ?? trigger.function ?? null,
    activation: trigger.activation ?? null,
    events: trigger.events ?? null,
    orientation: trigger.orientation ?? null,
  }));
}

function summarizeIndexes(indexes) {
  return (indexes || []).map((index) => ({
    schema: index.schema ?? null,
    table: index.table ?? null,
    name: index.name ?? null,
    columns: index.columns ?? null,
    unique: index.is_unique ?? index.unique ?? null,
    definition: index.definition ?? null,
  }));
}

function buildWarnings(data) {
  const warnings = [];
  const tables = Array.isArray(data.tables) ? data.tables : [];
  const policies = Array.isArray(data.policies) ? data.policies : [];
  const relationships = Array.isArray(data.relationships) ? data.relationships : [];
  const indexes = Array.isArray(data.indexes) ? data.indexes : [];

  for (const table of tables) {
    const isTable = !["view", "materialized_view"].includes(table.type);
    if (!isTable) continue;
    if (table.rls_enabled === false) {
      warnings.push({
        severity: "high",
        code: "rls-disabled",
        message: `RLS appears disabled on ${table.schema}.${table.name}.`,
      });
    }
    if (!table.primary_keys || table.primary_keys.length === 0) {
      warnings.push({
        severity: "medium",
        code: "missing-primary-key",
        message: `${table.schema}.${table.name} does not expose a primary key in the metadata.`,
      });
    }
  }

  for (const policy of policies) {
    const usingText = typeof policy.using === "string" ? policy.using.toLowerCase() : "";
    const checkText = typeof policy.check === "string" ? policy.check.toLowerCase() : "";
    if (usingText.includes("true") || checkText.includes("true")) {
      warnings.push({
        severity: "medium",
        code: "broad-policy",
        message: `Policy ${policy.name || "(unnamed)"} on ${policy.schema}.${policy.table} may be overly permissive.`,
      });
    }
  }

  const indexedTables = new Set(indexes.map((index) => `${index.schema}.${index.table}`));
  const relationshipCount = new Map();
  for (const rel of relationships) {
    const key = `${rel.schema}.${rel.table}`;
    relationshipCount.set(key, (relationshipCount.get(key) || 0) + 1);
  }
  for (const [tableKey, count] of relationshipCount.entries()) {
    if (count >= 3 && !indexedTables.has(tableKey)) {
      warnings.push({
        severity: "low",
        code: "relationship-heavy-no-indexes",
        message: `${tableKey} has several visible relationships but no index metadata was collected for it.`,
      });
    }
  }

  return warnings;
}

function summarizeOpenApi(openApi) {
  if (!openApi || typeof openApi !== "object") {
    return {
      definitions: [],
      paths: [],
    };
  }

  const definitions = Object.entries(openApi.definitions || {}).map(([name, definition]) => ({
    name,
    required: definition.required || [],
    properties: Object.entries(definition.properties || {}).map(([propName, prop]) => ({
      name: propName,
      type: prop.type ?? null,
      format: prop.format ?? null,
      description: prop.description ?? null,
      max_length: prop.maxLength ?? null,
    })),
  }));

  const paths = Object.entries(openApi.paths || {}).map(([route, methods]) => ({
    route,
    methods: Object.keys(methods || {}),
    tags: Array.from(
      new Set(
        Object.values(methods || {})
          .flatMap((method) => method.tags || [])
          .filter(Boolean)
      )
    ),
  }));

  const nonRpcPaths = paths.filter((path) => !path.route.startsWith("/rpc/"));
  const rpcPaths = paths.filter((path) => path.route.startsWith("/rpc/"));

  return {
    definitions,
    paths: [...nonRpcPaths.slice(0, 50), ...rpcPaths.slice(0, 25)],
    path_summary: {
      total_paths: paths.length,
      non_rpc_paths: nonRpcPaths.length,
      rpc_paths: rpcPaths.length,
      truncated: paths.length > 75,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { url, serviceKey } = getCredentials(args);

  if (!url || !serviceKey) {
    console.error(
      JSON.stringify(
        {
          error: "Missing credentials",
          message: "Provide SUPABASE_URL and SUPABASE_SECRET_KEY, or pass --url and --service-key.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const baseUrl = normalizeBaseUrl(url);
  const headers = jsonHeaders(serviceKey);
  const collectionNotes = [];

  const endpoints = [
    { key: "schemas", path: "/pg/meta/schemas" },
    { key: "tables", path: "/pg/meta/tables" },
    { key: "columns", path: "/pg/meta/columns" },
    { key: "relationships", path: "/pg/meta/relationships" },
    { key: "indexes", path: "/pg/meta/indexes" },
    { key: "views", path: "/pg/meta/views" },
    { key: "functions", path: "/pg/meta/functions" },
    { key: "triggers", path: "/pg/meta/triggers" },
    { key: "policies", path: "/pg/meta/policies" },
    { key: "roles", path: "/pg/meta/roles" },
  ];

  const raw = {};
  for (const endpoint of endpoints) {
    try {
      raw[endpoint.key] = await fetchJson(`${baseUrl}${endpoint.path}`, headers);
      collectionNotes.push({
        surface: endpoint.key,
        status: "ok",
        path: endpoint.path,
      });
    } catch (error) {
      raw[endpoint.key] = null;
      collectionNotes.push({
        surface: endpoint.key,
        status: "unavailable",
        path: endpoint.path,
        detail:
          typeof error.body === "string"
            ? error.body.slice(0, 400)
            : JSON.stringify(error.body || { message: error.message }).slice(0, 400),
      });
    }
  }

  let storage = null;
  try {
    storage = await fetchJson(`${baseUrl}/storage/v1/bucket`, headers);
    collectionNotes.push({
      surface: "storage",
      status: "ok",
      path: "/storage/v1/bucket",
    });
  } catch (error) {
    collectionNotes.push({
      surface: "storage",
      status: "unavailable",
      path: "/storage/v1/bucket",
      detail:
        typeof error.body === "string"
          ? error.body.slice(0, 400)
          : JSON.stringify(error.body || { message: error.message }).slice(0, 400),
    });
  }

  let openApi = null;
  try {
    openApi = await fetchJson(`${baseUrl}/rest/v1/`, {
      ...headers,
      Accept: "application/openapi+json",
    });
    collectionNotes.push({
      surface: "rest_openapi",
      status: "ok",
      path: "/rest/v1/",
    });
  } catch (error) {
    collectionNotes.push({
      surface: "rest_openapi",
      status: "unavailable",
      path: "/rest/v1/",
      detail:
        typeof error.body === "string"
          ? error.body.slice(0, 400)
          : JSON.stringify(error.body || { message: error.message }).slice(0, 400),
    });
  }

  let authUsers = null;
  try {
    const authResponse = await fetchJson(`${baseUrl}/auth/v1/admin/users?page=1&per_page=1000`, headers);
    authUsers = Array.isArray(authResponse?.users) ? authResponse.users : [];
    collectionNotes.push({
      surface: "auth_admin_users",
      status: "ok",
      path: "/auth/v1/admin/users",
    });
  } catch (error) {
    collectionNotes.push({
      surface: "auth_admin_users",
      status: "unavailable",
      path: "/auth/v1/admin/users",
      detail:
        typeof error.body === "string"
          ? error.body.slice(0, 400)
          : JSON.stringify(error.body || { message: error.message }).slice(0, 400),
    });
  }

  const tablesRaw = Array.isArray(raw.tables) ? raw.tables : [];
  const columnsRaw = Array.isArray(raw.columns) ? raw.columns : [];
  const viewsRaw = Array.isArray(raw.views) ? raw.views : [];
  const tableKinds = new Map();
  for (const view of viewsRaw) {
    if (view.schema && view.name) {
      tableKinds.set(`${view.schema}.${view.name}`, view.is_materialized_view ? "materialized_view" : "view");
    }
  }

  const tables = tablesRaw.map((table) => {
    const key = `${table.schema || ""}.${table.name || ""}`;
    return {
      ...compactTable(table),
      type: tableKinds.get(key) || "table",
    };
  });

  const columns = columnsRaw.map((column) => ({
    schema: column.schema ?? null,
    table: column.table ?? column.table_name ?? null,
    name: column.name ?? column.column_name ?? null,
    data_type: column.format ?? column.data_type ?? null,
    is_nullable: column.is_nullable ?? null,
    default_value: column.default_value ?? column.default ?? null,
    is_identity: column.is_identity ?? null,
    ordinal_position: column.ordinal_position ?? null,
    comment: column.comment ?? null,
  }));

  const columnsByTable = {};
  for (const column of columns) {
    const tableKey = `${column.schema}.${column.table}`;
    columnsByTable[tableKey] ||= [];
    columnsByTable[tableKey].push(column);
  }

  const schemas = Array.isArray(raw.schemas)
    ? raw.schemas.map((schema) => ({
        name: schema.name ?? null,
        owner: schema.owner ?? null,
        comment: schema.comment ?? null,
      }))
    : [];

  const policies = summarizePolicies(raw.policies);
  const relationships = summarizeRelationships(raw.relationships);
  const indexes = summarizeIndexes(raw.indexes);
  const functions = summarizeFunctions(raw.functions);
  const triggers = summarizeTriggers(raw.triggers);
  const roles = Array.isArray(raw.roles) ? raw.roles : [];
  const openApiSummary = summarizeOpenApi(openApi);

  const enrichedTables = tables.map((table) => {
    const key = `${table.schema}.${table.name}`;
    const tablePolicies = policies.filter((policy) => policy.schema === table.schema && policy.table === table.name);
    const related = relationships.filter((rel) => rel.schema === table.schema && rel.table === table.name);
    const tableIndexes = indexes.filter((index) => index.schema === table.schema && index.table === table.name);
    return {
      ...table,
      columns: columnsByTable[key] || [],
      relationships: related,
      policies: tablePolicies,
      indexes: tableIndexes,
    };
  });

  const result = {
    project: {
      supabase_url: baseUrl,
      project_ref: (() => {
        try {
          return new URL(baseUrl).hostname.split(".")[0];
        } catch {
          return null;
        }
      })(),
      collected_at: new Date().toISOString(),
    },
    schemas,
    tables: enrichedTables,
    columns,
    relationships,
    indexes,
    views: viewsRaw,
    functions,
    triggers,
    rls: enrichedTables.map((table) => ({
      schema: table.schema,
      table: table.name,
      enabled: table.rls_enabled,
    })),
    policies,
    grants: roles,
    api_exposure: {
      title: openApi?.info?.title ?? null,
      version: openApi?.info?.version ?? null,
      definitions: openApiSummary.definitions,
      paths: openApiSummary.paths,
      path_summary: openApiSummary.path_summary,
    },
    auth: {
      users: Array.isArray(authUsers)
        ? authUsers.map((user) => ({
            id: user.id,
            email: user.email ?? null,
            role: user.role ?? null,
            created_at: user.created_at ?? null,
            last_sign_in_at: user.last_sign_in_at ?? null,
            is_anonymous: user.is_anonymous ?? null,
            provider: user.app_metadata?.provider ?? null,
            providers: user.app_metadata?.providers ?? null,
            user_metadata_keys: Object.keys(user.user_metadata || {}),
          }))
        : [],
    },
    storage: Array.isArray(storage)
      ? storage.map((bucket) => ({
          id: bucket.id ?? null,
          name: bucket.name ?? null,
          public: bucket.public ?? null,
          file_size_limit: bucket.file_size_limit ?? null,
          allowed_mime_types: bucket.allowed_mime_types ?? null,
        }))
      : storage,
    collection_notes: collectionNotes,
  };

  result.warnings = buildWarnings(result);
  if (result.tables.length === 0 && result.api_exposure.definitions.length > 0) {
    result.warnings.push({
      severity: "medium",
      code: "partial-api-exposure",
      message:
        "The REST API exposed object definitions, but direct database metadata remained unavailable. The audit is partial and likely limited to exposed API objects.",
    });
  }
  if (result.tables.length === 0 && result.api_exposure.definitions.length <= 3) {
    result.warnings.push({
      severity: "high",
      code: "no-app-table-metadata",
      message:
        "Live database metadata for application tables was not visible from the available surfaces. This often means pg-meta is unavailable and the Data API is exposing little or no application schema.",
    });
  }

  const out = JSON.stringify(result, null, 2);
  if (args.out) {
    fs.writeFileSync(args.out, out);
  }
  process.stdout.write(`${out}\n`);
}

main().catch((error) => {
  const payload = {
    error: "Introspection failed",
    message: error.message,
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(1);
});
