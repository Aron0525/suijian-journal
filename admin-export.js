(function exposeAdminExport(globalObject) {
  'use strict';

  const encoder = new TextEncoder();
  const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function cloneWithoutSecrets(value) {
    if (Array.isArray(value)) return value.map(cloneWithoutSecrets);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['apikey', 'api_key', 'api-key'].includes(key.toLowerCase()))
      .map(([key, child]) => [key, cloneWithoutSecrets(child)]));
  }

  function stringifyCell(value) {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map(stringifyCell).filter(Boolean).join('、');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function exportDate(now) {
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function safeOwner(user) {
    const source = user?.email || user?.id || 'user';
    return String(source).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'user';
  }

  function rowsFromRecords(records, columns) {
    return [columns.map((column) => column.label), ...(Array.isArray(records) ? records : []).map((record) => (
      columns.map((column) => stringifyCell(typeof column.value === 'function' ? column.value(record) : record?.[column.value]))
    ))];
  }

  function workbookSheets(user, rawData) {
    const data = cloneWithoutSecrets(rawData || {});
    const config = data.ai_settings?.config || {};
    return [
      { name: '账号', rows: [
        ['字段', '内容'],
        ['邮箱', user?.email || ''], ['用户 ID', user?.id || ''], ['注册时间', user?.created_at || ''],
        ['最近登录', user?.last_sign_in_at || ''], ['邮箱验证时间', user?.email_confirmed_at || ''],
        ['账号状态', user?.banned_until ? '已停用' : '正常'],
      ] },
      { name: '日记', rows: rowsFromRecords(data.entries, [
        { label: 'ID', value: 'id' }, { label: '日期', value: 'entry_date' }, { label: '标题', value: 'title' },
        { label: '内容', value: 'content' }, { label: '原始内容', value: 'original_content' },
        { label: '心情', value: 'mood' }, { label: '标签', value: 'tags' }, { label: '附件', value: 'attachments' },
        { label: '创建时间', value: 'created_at' }, { label: '更新时间', value: 'updated_at' }, { label: '删除时间', value: 'deleted_at' },
      ]) },
      { name: '草稿', rows: rowsFromRecords(data.drafts, [
        { label: 'ID', value: 'id' }, { label: '日期', value: 'draft_date' }, { label: '草稿内容', value: 'payload' },
        { label: '更新时间', value: 'updated_at' }, { label: '删除时间', value: 'deleted_at' },
      ]) },
      { name: '当天摘要', rows: rowsFromRecords(data.daily_summaries, [
        { label: '日期', value: 'entry_date' }, { label: '摘要', value: 'content' }, { label: '更新时间', value: 'updated_at' },
      ]) },
      { name: '阶段总结', rows: rowsFromRecords(data.period_summaries, [
        { label: '开始日期', value: 'start_date' }, { label: '结束日期', value: 'end_date' },
        { label: '总结', value: 'content' }, { label: '更新时间', value: 'updated_at' },
      ]) },
      { name: '待办', rows: rowsFromRecords(data.tasks, [
        { label: 'ID', value: 'id' }, { label: '内容', value: 'content' }, { label: '已完成', value: (record) => record?.completed ? '是' : '否' },
        { label: '更新时间', value: 'updated_at' },
      ]) },
      { name: '备份', rows: rowsFromRecords(data.backups, [
        { label: '备份日期', value: 'backup_date' }, { label: '原始备份数据', value: 'payload' }, { label: '创建时间', value: 'created_at' },
      ]) },
      { name: '附件', rows: rowsFromRecords(data.attachments, [
        { label: '名称', value: 'name' }, { label: '路径', value: 'path' }, { label: '类型', value: (record) => record?.metadata?.mimetype || '' },
        { label: '字节数', value: (record) => record?.metadata?.size || '' }, { label: '创建时间', value: 'created_at' }, { label: '更新时间', value: 'updated_at' },
      ]) },
      { name: '模型配置', rows: [
        ['字段', '内容'], ['接口类型', config.interfaceType || config.interface_type || ''],
        ['平台', config.provider || config.platform || ''], ['API 地址', config.endpoint || ''],
        ['模型', config.model || ''], ['AI 整理提示词', config.organizePrompt || config.organize_prompt || ''],
        ['AI 汇总提示词', config.summaryPrompt || config.summary_prompt || ''],
        ['API Key', data.ai_settings?.api_key_configured ? '已配置（内容不导出）' : '未配置'],
      ] },
    ];
  }

  function xmlEscape(value) {
    return stringifyCell(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function columnName(index) {
    let value = index + 1;
    let output = '';
    while (value) {
      value -= 1;
      output = String.fromCharCode(65 + (value % 26)) + output;
      value = Math.floor(value / 26);
    }
    return output;
  }

  function sheetXml(rows) {
    const body = rows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
        const style = rowIndex === 0 ? ' s="1"' : '';
        return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
      }).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>${body}</sheetData></worksheet>`;
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      table[index] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function uint16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }

  function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  }

  function concatBytes(parts) {
    const length = parts.reduce((total, part) => total + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  }

  function zipStore(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
      const checksum = crc32(data);
      const local = concatBytes([
        uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
        uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), name, data,
      ]);
      locals.push(local);
      centrals.push(concatBytes([
        uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
        uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), uint16(0),
        uint16(0), uint16(0), uint32(0), uint32(offset), name,
      ]));
      offset += local.length;
    }
    const central = concatBytes(centrals);
    return concatBytes([
      ...locals, central, uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
      uint32(central.length), uint32(offset), uint16(0),
    ]);
  }

  function xlsxBytes(sheets) {
    const worksheetOverrides = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const workbookSheetsXml = sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
    const workbookRels = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
    const files = [
      { name: '[Content_Types].xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${worksheetOverrides}</Types>` },
      { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheetsXml}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>' },
      ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet.rows) })),
    ];
    return zipStore(files);
  }

  function createJsonExport(user, data, now = new Date()) {
    const payload = cloneWithoutSecrets({ exported_at: now.toISOString(), user, data });
    return {
      fileName: `suijian-${safeOwner(user)}-${exportDate(now)}.json`,
      mimeType: 'application/json;charset=utf-8',
      text: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  function createExcelExport(user, data, now = new Date()) {
    const sheets = workbookSheets(user, data);
    return {
      fileName: `suijian-${safeOwner(user)}-${exportDate(now)}.xlsx`,
      mimeType: EXCEL_MIME,
      bytes: xlsxBytes(sheets),
      sheetNames: sheets.map((sheet) => sheet.name),
    };
  }

  globalObject.SuijianAdminExport = Object.freeze({ createJsonExport, createExcelExport, workbookSheets });
})(globalThis);
