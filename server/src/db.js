import mysql from "mysql2/promise";
import { appConfig } from "./config.js";

let pool;

export async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: appConfig.mysql.host,
    port: appConfig.mysql.port,
    user: appConfig.mysql.user,
    password: appConfig.mysql.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${appConfig.mysql.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await connection.end();
}

export async function getPool() {
  if (!pool) {
    await ensureDatabase();
    pool = mysql.createPool({
      host: appConfig.mysql.host,
      port: appConfig.mysql.port,
      user: appConfig.mysql.user,
      password: appConfig.mysql.password,
      database: appConfig.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      dateStrings: true,
    });
  }

  return pool;
}

export async function closePool() {
  if (!pool) {
    return;
  }

  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

export async function query(sql, params = []) {
  const activePool = await getPool();
  const [rows] = await activePool.execute(sql, params);
  return rows;
}

export async function withTransaction(work) {
  const activePool = await getPool();
  const connection = await activePool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
