import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { getPool, sql } from './db.js';
import { requireAdmin, requireAuth } from './auth.js';

const app = express();
const port = Number(process.env.API_PORT || 3001);
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const configuredOrigins = [...new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:3000',
  'https://localhost:5173',
  'https://localhost:5174',
  'https://tsitsm-v2.vercel.app',
  ...(process.env.CLIENT_ORIGIN || '').split(','),
])]
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalNetworkOrigin = (origin: string | undefined) => {
  if (!origin) return true;

  try {
    const { protocol, hostname } = new URL(origin);
    if (!['http:', 'https:'].includes(protocol)) return false;

    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
    const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)
      || hostname.endsWith('.local');

    return isLocalHost || isPrivateIp;
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '2mb' }));

const json = (value: unknown) => JSON.stringify(value ?? []);
const parseJson = (value: unknown) => { try { return value ? JSON.parse(String(value)) : []; } catch { return []; } };
const assetFields = ['EmployeeId','EmployeeName','UserEmail','MobileNumber','Department','Location','OwnerId','Category','SerialNumber','Manufacturer','Ownership','VendorName','Model','PurchaseDate','PurchasePrice','WarrantyExpiration','Condition','Status','CpuManufacturer','CpuModel','CpuGeneration','RamType','RamSizeGb','StorageType','StorageCapacityGb','Os','OperatingSystemVersion','MacAddress','PurchaseOrderNumber','Notes','ImageUrl','TagsJson'];
const mapAsset = (row: Record<string, unknown>) => ({ ...row, id: row.Id, owner: row.OwnerId, tags: parseJson(row.TagsJson), createdAt: row.CreatedAt, updatedAt: row.UpdatedAt });
const escapeHtml = (value: unknown) => String(value ?? 'N/A').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
const createEmailTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const outlookEmail = process.env.OUTLOOK_EMAIL;
  const outlookPassword = process.env.OUTLOOK_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  if (outlookEmail && outlookPassword) {
    return nodemailer.createTransport({ service: 'outlook', auth: { user: outlookEmail, pass: outlookPassword } });
  }

  return null;
};
const sendNotificationEmail = async (to: string | undefined, subject: string, data: Record<string, unknown>) => {
  if (!to || !to.includes('@')) return;
  const transporter = createEmailTransporter();
  if (!transporter) {
    console.warn('Incident email skipped: SMTP_HOST/SMTP_USER/SMTP_PASS or OUTLOOK_EMAIL/OUTLOOK_PASSWORD is not configured');
    return;
  }
  const from = process.env.SMTP_FROM || 'onedesk@thaisummit.ind.in';
  const fields = Object.entries(data).map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('');
  await transporter.sendMail({
    from,
    to,
    subject,
    html: `<html><body><h2>TS Onedesk Notification</h2>${fields}<p>This is an automated notification.</p></body></html>`,
  });
};
const notify = (to: string | undefined, subject: string, data: Record<string, unknown>) => {
  void sendNotificationEmail(to, subject, data).catch((error) => console.error('Email notification failed:', error));
};
const notificationSubject = 'TS Onedesk Notification';
const emailValue = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;
const adminNotificationEmail = () => process.env.ADMIN_EMAIL || 'itadmin@thaisummit.ind.in';

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', requireAuth);

app.get('/api/me', (req, res) => res.json(req.user));
app.get('/api/profile', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.NVarChar(128), req.user!.id).query('SELECT * FROM dbo.Users WHERE Id = @id');
  const profile = result.recordset[0];
  res.json(profile ? {
    uid: profile.Id,
    email: profile.Email,
    displayName: profile.DisplayName,
    employeeName: profile.EmployeeName,
    employeeId: profile.EmployeeId,
    mobile: profile.Mobile,
    department: profile.Department,
  } : null);
});
app.put('/api/profile', async (req, res) => {
  const pool = await getPool(); const body = req.body;
  await pool.request().input('id', sql.NVarChar(128), req.user!.id).input('email', sql.NVarChar(320), req.user!.email)
    .input('displayName', sql.NVarChar(200), body.displayName || body.employeeName || req.user!.name).input('employeeName', sql.NVarChar(200), body.employeeName || body.displayName || req.user!.name)
    .input('employeeId', sql.NVarChar(100), body.employeeId || '').input('mobile', sql.NVarChar(50), body.mobile || '').input('department', sql.NVarChar(150), body.department || '')
    .query(`UPDATE dbo.Users SET DisplayName=@displayName, EmployeeName=@employeeName, EmployeeId=@employeeId, Mobile=@mobile, Department=@department, UpdatedAt=SYSUTCDATETIME() WHERE Id=@id`);
  res.json({ ok: true });
});
app.put('/api/profile/sync', async (req, res) => {
  const pool = await getPool(); const body = req.body;
  await pool.request().input('id', sql.NVarChar(128), req.user!.id)
    .input('displayName', sql.NVarChar(200), body.displayName || null)
    .input('mobile', sql.NVarChar(50), body.mobile || null)
    .input('department', sql.NVarChar(150), body.department || null)
    .query(`UPDATE dbo.Users SET
      DisplayName=COALESCE(NULLIF(@displayName, ''), DisplayName),
      EmployeeName=COALESCE(NULLIF(@displayName, ''), EmployeeName),
      Mobile=COALESCE(NULLIF(@mobile, ''), Mobile),
      Department=COALESCE(NULLIF(@department, ''), Department),
      UpdatedAt=SYSUTCDATETIME()
      WHERE Id=@id`);
  res.json({ ok: true });
});

app.get('/api/assets', async (req, res) => {
  const pool = await getPool(); const request = pool.request();
  const result = req.user!.isAdmin ? await request.query('SELECT * FROM dbo.Assets ORDER BY EmployeeName') : await request.input('id', sql.NVarChar(128), req.user!.id).input('email', sql.NVarChar(320), req.user!.email).query('SELECT * FROM dbo.Assets WHERE OwnerId=@id OR LOWER(UserEmail)=@email ORDER BY EmployeeName');
  res.json(result.recordset.map(mapAsset));
});
app.post('/api/assets', requireAdmin, async (req, res) => {
  const body = req.body; const pool = await getPool(); const request = pool.request();
  const valueFor = (field: string) => body[field] ?? body[field[0].toLowerCase() + field.slice(1)] ?? (field === 'OwnerId' ? body.owner : null);
  for (const field of assetFields) if (field !== 'TagsJson') request.input(field, valueFor(field));
  request.input('TagsJson', sql.NVarChar(sql.MAX), json(body.tags || body.TagsJson || []));
  const result = await request.query(`INSERT dbo.Assets (${assetFields.join(',')}) OUTPUT INSERTED.* VALUES (${assetFields.map((field) => field === 'TagsJson' ? '@TagsJson' : `@${field}`).join(',')})`);
  res.status(201).json(mapAsset(result.recordset[0]));
});
app.put('/api/assets/:id', requireAdmin, async (req, res) => {
  const body = req.body; const pool = await getPool(); const request = pool.request().input('id', sql.UniqueIdentifier, req.params.id);
  const valueFor = (field: string) => body[field] ?? body[field[0].toLowerCase() + field.slice(1)] ?? (field === 'OwnerId' ? body.owner : null);
  for (const field of assetFields) if (field !== 'TagsJson') request.input(field, valueFor(field));
  request.input('TagsJson', sql.NVarChar(sql.MAX), json(body.tags || body.TagsJson || []));
  const result = await request.query(`UPDATE dbo.Assets SET ${assetFields.map((field) => `${field}=@${field}`).join(',')}, UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@id`);
  res.json(mapAsset(result.recordset[0]));
});
app.delete('/api/assets/:id', requireAdmin, async (req, res) => { const pool = await getPool(); await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM dbo.Assets WHERE Id=@id'); res.status(204).end(); });

const comments = (rows: Record<string, unknown>[]) => rows.map((row) => ({ id: row.Id, authorId: row.AuthorId, authorName: row.AuthorName, authorEmail: row.AuthorEmail, authorRole: row.AuthorRole, text: row.Text, createdAt: row.CreatedAt }));
const mapIncident = (row: Record<string, unknown>) => ({
  id: row.Id,
  incidentNumber: row.IncidentNumber,
  reporterId: row.ReporterId,
  reporterEmail: row.ReporterEmail,
  reporterName: row.ReporterName,
  reporterEmployeeId: row.ReporterEmployeeId,
  reporterMobile: row.ReporterMobile,
  reporterDepartment: row.ReporterDepartment,
  title: row.Title,
  assetId: row.AssetId,
  assetName: row.AssetName,
  description: row.Description,
  severity: row.Severity,
  category: row.Category,
  status: row.Status,
  adminNotes: row.AdminNotes,
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt,
});
app.get('/api/asset-requests', async (req, res) => { const pool = await getPool(); const result = req.user!.isAdmin ? await pool.request().query('SELECT * FROM dbo.AssetRequests ORDER BY CreatedAt DESC') : await pool.request().input('id', sql.NVarChar(128), req.user!.id).query('SELECT * FROM dbo.AssetRequests WHERE RequesterId=@id ORDER BY CreatedAt DESC'); const output = []; for (const row of result.recordset) { const c = await pool.request().input('id', sql.UniqueIdentifier, String(row.Id)).query('SELECT * FROM dbo.AssetRequestComments WHERE RequestId=@id ORDER BY CreatedAt'); output.push({ ...row, id: row.Id, comments: comments(c.recordset) }); } res.json(output); });
app.post('/api/asset-requests', async (req, res) => { const b=req.body; const p=await getPool(); const r=await p.request().input('requesterId',sql.NVarChar(128),req.user!.id).input('requesterEmail',sql.NVarChar(320),req.user!.email).input('requesterName',sql.NVarChar(200),b.requesterName).input('requesterDepartment',sql.NVarChar(150),b.requesterDepartment).input('employeeId',sql.NVarChar(100),b.employeeId).input('employeeName',sql.NVarChar(200),b.employeeName).input('mobile',sql.NVarChar(50),b.mobile).input('category',sql.NVarChar(50),b.category).input('manufacturer',sql.NVarChar(150),b.manufacturer).input('model',sql.NVarChar(150),b.model).input('specifications',sql.NVarChar(sql.MAX),b.specifications).input('justification',sql.NVarChar(sql.MAX),b.justification).input('priority',sql.NVarChar(30),b.priority).query(`INSERT dbo.AssetRequests (RequesterId,RequesterEmail,RequesterName,RequesterDepartment,EmployeeId,EmployeeName,Mobile,Category,Manufacturer,Model,Specifications,Justification,Priority) OUTPUT INSERTED.* VALUES (@requesterId,@requesterEmail,@requesterName,@requesterDepartment,@employeeId,@employeeName,@mobile,@category,@manufacturer,@model,@specifications,@justification,@priority)`); const request = r.recordset[0]; notify(adminNotificationEmail(), notificationSubject, request); res.status(201).json({ ...request, id:request.Id, comments:[] }); });
app.patch('/api/asset-requests/:id', requireAdmin, async (req,res)=>{const p=await getPool();const r=await p.request().input('id',sql.UniqueIdentifier,req.params.id).input('status',sql.NVarChar(30),req.body.status).input('notes',sql.NVarChar(sql.MAX),req.body.adminNotes||null).query('UPDATE dbo.AssetRequests SET Status=@status, AdminNotes=@notes, UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@id');const request=r.recordset[0];notify(emailValue(request.RequesterEmail), notificationSubject, request);res.json({...request,id:request.Id});});
app.post('/api/asset-requests/:id/comments', async (req,res)=>{const b=req.body;const p=await getPool();const r=await p.request().input('requestId',sql.UniqueIdentifier,req.params.id).input('authorId',sql.NVarChar(128),req.user!.id).input('authorName',sql.NVarChar(200),b.authorName).input('authorEmail',sql.NVarChar(320),req.user!.email).input('authorRole',sql.NVarChar(30),req.user!.isAdmin?'admin':'user').input('text',sql.NVarChar(sql.MAX),b.text).query('INSERT dbo.AssetRequestComments (RequestId,AuthorId,AuthorName,AuthorEmail,AuthorRole,Text) OUTPUT INSERTED.* VALUES (@requestId,@authorId,@authorName,@authorEmail,@authorRole,@text)');if(req.user!.isAdmin){const request=(await p.request().input('id',sql.UniqueIdentifier,req.params.id).query('SELECT * FROM dbo.AssetRequests WHERE Id=@id')).recordset[0];notify(emailValue(request?.RequesterEmail), notificationSubject, {...request, AdminComment:b.text});}res.status(201).json(r.recordset[0]);});

app.get('/api/incidents', async (req,res)=>{const p=await getPool();const r=req.user!.isAdmin?await p.request().query('SELECT * FROM dbo.Incidents ORDER BY CreatedAt DESC'):await p.request().input('id',sql.NVarChar(128),req.user!.id).query('SELECT * FROM dbo.Incidents WHERE ReporterId=@id ORDER BY CreatedAt DESC');const out=[];for(const row of r.recordset){const c=await p.request().input('id',sql.UniqueIdentifier,String(row.Id)).query('SELECT * FROM dbo.IncidentComments WHERE IncidentId=@id ORDER BY CreatedAt');out.push({...mapIncident(row),comments:comments(c.recordset)});}res.json(out);});
app.post('/api/incidents', async(req,res)=>{const b=req.body;const p=await getPool();const tx=p.transaction();await tx.begin();try{const n=await tx.request().query(`SELECT ISNULL(MAX(IncidentNumber),0)+1 AS NextNumber FROM dbo.Incidents`);const number=n.recordset[0].NextNumber;const r=await tx.request().input('number',sql.Int,number).input('reporterId',sql.NVarChar(128),req.user!.id).input('reporterEmail',sql.NVarChar(320),req.user!.email).input('reporterName',sql.NVarChar(200),b.reporterName || req.user!.name || req.user!.email).input('reporterEmployeeId',sql.NVarChar(100),b.reporterEmployeeId || '').input('reporterMobile',sql.NVarChar(50),b.reporterMobile || '').input('reporterDepartment',sql.NVarChar(150),b.reporterDepartment || '').input('title',sql.NVarChar(300),b.title).input('assetId',sql.NVarChar(100),b.assetId).input('assetName',sql.NVarChar(200),b.assetName).input('description',sql.NVarChar(sql.MAX),b.description).input('severity',sql.NVarChar(30),b.severity).input('category',sql.NVarChar(50),b.category).query(`INSERT dbo.Incidents (IncidentNumber,ReporterId,ReporterEmail,ReporterName,ReporterEmployeeId,ReporterMobile,ReporterDepartment,Title,AssetId,AssetName,Description,Severity,Category) OUTPUT INSERTED.* VALUES (@number,@reporterId,@reporterEmail,@reporterName,@reporterEmployeeId,@reporterMobile,@reporterDepartment,@title,@assetId,@assetName,@description,@severity,@category)`);await tx.commit();const incident=mapIncident(r.recordset[0]);notify(adminNotificationEmail(), notificationSubject, incident);res.status(201).json({...incident,comments:[]});}catch(e){await tx.rollback();throw e;}});
app.patch('/api/incidents/:id',requireAdmin,async(req,res)=>{const p=await getPool();const r=await p.request().input('id',sql.UniqueIdentifier,req.params.id).input('status',sql.NVarChar(40),req.body.status).input('notes',sql.NVarChar(sql.MAX),req.body.adminNotes||null).query('UPDATE dbo.Incidents SET Status=@status,AdminNotes=@notes,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@id');const incident=mapIncident(r.recordset[0]);notify(typeof incident.reporterEmail === 'string' ? incident.reporterEmail : undefined, notificationSubject, incident);res.json(incident);});
app.post('/api/incidents/:id/comments',async(req,res)=>{const b=req.body;const p=await getPool();const r=await p.request().input('incidentId',sql.UniqueIdentifier,req.params.id).input('authorId',sql.NVarChar(128),req.user!.id).input('authorName',sql.NVarChar(200),b.authorName).input('authorEmail',sql.NVarChar(320),req.user!.email).input('authorRole',sql.NVarChar(30),req.user!.isAdmin?'admin':'user').input('text',sql.NVarChar(sql.MAX),b.text).query('INSERT dbo.IncidentComments (IncidentId,AuthorId,AuthorName,AuthorEmail,AuthorRole,Text) OUTPUT INSERTED.* VALUES (@incidentId,@authorId,@authorName,@authorEmail,@authorRole,@text)');if(req.user!.isAdmin){const incident=(await p.request().input('id',sql.UniqueIdentifier,req.params.id).query('SELECT * FROM dbo.Incidents WHERE Id=@id')).recordset[0];notify(emailValue(incident?.ReporterEmail), notificationSubject, {...incident, AdminComment:b.text});}res.status(201).json(r.recordset[0]);});
app.get('/api/activity-logs', requireAdmin, async(_req,res)=>{const p=await getPool();const r=await p.request().query('SELECT TOP 500 * FROM dbo.ActivityLogs WHERE CreatedAt >= DATEADD(day,-30,SYSUTCDATETIME()) ORDER BY CreatedAt DESC');res.json(r.recordset.map((x)=>({...x,id:x.Id})));});
app.post('/api/activity-logs', async(req,res)=>{const b=req.body;const p=await getPool();await p.request().input('module',sql.NVarChar(40),b.module).input('action',sql.NVarChar(80),b.action).input('description',sql.NVarChar(sql.MAX),b.description).input('performedBy',sql.NVarChar(200),req.user!.name).input('performedByEmail',sql.NVarChar(320),req.user!.email).input('targetName',sql.NVarChar(300),b.targetName).input('targetId',sql.NVarChar(100),b.targetId).query('INSERT dbo.ActivityLogs (Module,Action,Description,PerformedBy,PerformedByEmail,TargetName,TargetId) VALUES (@module,@action,@description,@performedBy,@performedByEmail,@targetName,@targetId)');res.status(201).json({ok:true});});

if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  const distPath = path.resolve(appRoot, '../dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const hasFrontendBuild = fs.existsSync(distIndexPath);

  if (hasFrontendBuild) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api\/).*$/, (req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(distIndexPath);
    });
  } else {
    app.get(/^(?!\/api\/).*$/, (_req, res) => {
      res.status(200).json({
        ok: false,
        message: 'Frontend bundle is not built in this deployment. Deploy the Vite app separately or build the dist folder before using this API project as the root URL.',
      });
    });
  }
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' }); });
if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`ITSM API listening on http://localhost:${port}`));
}

export default app;
