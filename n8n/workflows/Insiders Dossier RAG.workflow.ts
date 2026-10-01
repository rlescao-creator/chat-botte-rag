const embed_Chunk = embedding({ type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi', version: 1.2, config: { name: 'Embed Chunk', parameters: { model: 'text-embedding-3-small', options: { dimensions: 1536 } }, position: [2320, 540] } });
const keep_Chunk_Whole = textSplitter({ type: '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter', version: 1, config: { name: 'Keep Chunk Whole', parameters: { chunkSize: 8000, chunkOverlap: 0, options: {} }, position: [2600, 740] } });
const chunk_Loader = documentLoader({ type: '@n8n/n8n-nodes-langchain.documentDefaultDataLoader', version: 1.1, config: { name: 'Chunk Loader', parameters: { dataType: 'json', jsonMode: 'expressionData', jsonData: expr('{{ $json.content }}'), textSplittingMode: 'custom', options: { metadata: { metadataValues: [{ name: 'source', value: expr('{{ $json.source }}') }, { name: 'page', value: expr('{{ $json.page }}') }, { name: 'page_end', value: expr('{{ $json.pageEnd }}') }, { name: 'chunk_index', value: expr('{{ $json.chunkIndex }}') }, { name: 'context', value: expr('{{ $json.context }}') }, { name: 'questions', value: expr('{{ $json.questions }}') }, { name: 'keywords', value: expr('{{ $json.keywords }}') }, { name: 'entities', value: expr('{{ $json.entities }}') }, { name: 'relations', value: expr('{{ $json.relations }}') }, { name: 'enriched', value: expr('{{ $json.enriched }}') }] } } }, position: [2520, 540], subnodes: { textSplitter: keep_Chunk_Whole } } });
const enrichment_Model = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', version: 1.2, config: { name: 'Enrichment Model', parameters: { modelName: 'models/gemini-3-flash-preview', options: { temperature: 0 } }, position: [1100, 560] } });
const enrichment_Parser = outputParser({ type: '@n8n/n8n-nodes-langchain.outputParserStructured', version: 1.3, config: { name: 'Enrichment Parser', parameters: { schemaType: 'manual', inputSchema: '{\n  "type": "object",\n  "properties": {\n    "context": { "type": "string" },\n    "hypothetical_questions": { "type": "array", "items": { "type": "string" } },\n    "keywords": { "type": "array", "items": { "type": "string" } },\n    "entities": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "name": { "type": "string" },\n          "type": { "type": "string" }\n        },\n        "required": ["name", "type"]\n      }\n    },\n    "relations": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "subject": { "type": "string" },\n          "relation": { "type": "string" },\n          "object": { "type": "string" }\n        },\n        "required": ["subject", "relation", "object"]\n      }\n    }\n  },\n  "required": ["context", "hypothetical_questions", "keywords", "entities", "relations"]\n}' }, position: [1260, 560] } });
const embed_Query = embedding({ type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi', version: 1.2, config: { name: 'Embed Query', parameters: { options: { dimensions: 1536 } }, position: [1880, 1020] } });
const rerank_Model = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', version: 1.2, config: { name: 'Rerank Model', parameters: { modelName: 'models/gemini-2.5-flash-lite', options: { temperature: 0 } }, position: [2500, 1020] } });
const rerank_Parser = outputParser({ type: '@n8n/n8n-nodes-langchain.outputParserStructured', version: 1.3, config: { name: 'Rerank Parser', parameters: { schemaType: 'manual', inputSchema: '{\n  "type": "object",\n  "properties": {\n    "ranking": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "index": { "type": "integer" },\n          "score": { "type": "number" }\n        },\n        "required": ["index", "score"]\n      }\n    }\n  },\n  "required": ["ranking"]\n}' }, position: [2660, 1020] } });
const answer_Model = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', version: 1.2, config: { name: 'Answer Model', parameters: { modelName: 'models/gemini-3-flash-preview', options: {} }, position: [3080, 1020] } });
const route_Model = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', version: 1.2, config: { name: 'Route Model', parameters: { modelName: 'models/gemini-3-flash-preview', options: { temperature: 0 } }, position: [1300, 1020] } });
const route_Parser = outputParser({ type: '@n8n/n8n-nodes-langchain.outputParserStructured', version: 1.3, config: { name: 'Route Parser', parameters: { schemaType: 'manual', inputSchema: '{\n  "type": "object",\n  "properties": {\n    "standalone_question": { "type": "string" },\n    "queries": { "type": "array", "items": { "type": "string" } },\n    "keywords": { "type": "array", "items": { "type": "string" } },\n    "filters": {\n      "type": "object",\n      "properties": {\n        "source": { "type": "string" },\n        "page_from": { "type": "integer" },\n        "page_to": { "type": "integer" }\n      },\n      "required": ["source", "page_from", "page_to"]\n    }\n  },\n  "required": ["standalone_question", "queries", "keywords", "filters"]\n}' }, position: [1460, 1020] } });

const upload_Document = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: { name: 'Upload Document', parameters: { formTitle: 'Insiders Dossier RAG', formDescription: 'Upload the PDF to split, embed and store in the Supabase vector store.', formFields: { values: [{ fieldLabel: 'Document', fieldType: 'file', multipleFiles: false, acceptFileTypes: '.pdf', requiredField: true }] }, options: { buttonLabel: 'Vectorize', respondWithOptions: { values: { formSubmittedText: 'Upload received. Vectorization is running.' } } } }, position: [0, 208] }
});

const extract_PDF_Text = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: { name: 'Extract PDF Text', parameters: { operation: 'pdf', binaryPropertyName: expr('{{ Object.keys($binary)[0] }}'), options: { joinPages: false } }, position: [220, 200] }
});

const clean_Text = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Clean Text', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const raw = $input.first().json.text;\nconst pages = Array.isArray(raw) ? raw : [raw || \'\'];\n\nconst upload = $(\'Upload Document\').first().json.Document;\nconst source = (Array.isArray(upload) ? upload[0]?.filename : upload?.filename) || \'unknown\';\n\nconst cleanPage = (pageText) => {\n  let text = String(pageText || \'\').normalize(\'NFKC\');\n\n  // Control and invisible characters\n  text = text.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, \'\');\n  text = text.replace(/[­​-‍﻿]/g, \'\');\n\n  // Typographic quotes to plain quotes\n  text = text.replace(/[\u2018\u2019]/g, "\'").replace(/[\u201C\u201D]/g, \'"\');\n\n  // Words cut by a hyphen at the end of a line\n  text = text.replace(/([A-Za-z])-\\n([a-z])/g, \'$1$2\');\n\n  // Drop lines that only hold a page number\n  text = text\n    .split(\'\\n\')\n    .map((line) => line.trim())\n    .filter((line) => !/^\\d{1,4}$/.test(line))\n    .join(\'\\n\');\n\n  // Keep paragraph breaks, join wrapped lines, collapse spaces\n  return text\n    .replace(/\\n{2,}/g, \'\\n\\n\')\n    .replace(/([^\\n])\\n([^\\n])/g, \'$1 $2\')\n    .replace(/[ \\t]+/g, \' \')\n    .trim();\n};\n\n// Join all pages into one continuous text and remember where each page starts\nlet text = \'\';\nconst pageStarts = [];\n\npages.forEach((pageText, index) => {\n  const cleaned = cleanPage(pageText);\n  if (cleaned.length < 40) return;\n  if (text.length > 0) {\n    const sentenceEnded = /[.!?:"\')\\]]$/.test(text);\n    text += sentenceEnded ? \'\\n\\n\' : \' \';\n  }\n  pageStarts.push({ page: index + 1, start: text.length });\n  text += cleaned;\n});\n\nreturn [{ json: { text, source, pageStarts, pageCount: pageStarts.length, charCount: text.length } }];' }, position: [440, 200], notes: 'Cleans each page before chunking: removes control and invisible characters, page number lines and end of line hyphens, normalizes quotes and spaces, and drops empty pages. Outputs one item per page.' }
});

const recursive_Rolling_Chunks = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Recursive Rolling Chunks', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const MIN_CHUNKS = 10;   // a document under 100 pages must give 10 to 100 chunks\nconst MAX_CHUNKS = 100;\nconst OVERLAP = 200;     // characters shared by two consecutive chunks\nconst PIECE = 150;       // target size of the units the window rolls over\nconst CONTEXT = 500;     // neighbouring text given to the enrichment model\nconst MIN_SIZE = 400;\nconst MAX_SIZE = 6000;\nconst SEPARATORS = [\'\\n\\n\', \'\\n\', \'. \', \'? \', \'! \', \'; \', \', \', \' \'];\n\nconst doc = $input.first().json;\nconst text = doc.text;\nconst pageStarts = doc.pageStarts || [];\nconst pageCount = doc.pageCount || pageStarts.length || 1;\n\n// Recursive split: try the coarsest separator first, go finer only when a part is still too long\nconst splitRecursive = (part, level) => {\n  if (part.length <= PIECE) return [part];\n  if (level >= SEPARATORS.length) {\n    const cut = [];\n    for (let i = 0; i < part.length; i += PIECE) cut.push(part.slice(i, i + PIECE));\n    return cut;\n  }\n  const separator = SEPARATORS[level];\n  const parts = part.split(separator);\n  if (parts.length === 1) return splitRecursive(part, level + 1);\n  const result = [];\n  parts.forEach((p, index) => {\n    const withSeparator = index < parts.length - 1 ? p + separator : p;\n    if (withSeparator.length === 0) return;\n    for (const piece of splitRecursive(withSeparator, level + 1)) result.push(piece);\n  });\n  return result;\n};\n\nconst pieces = splitRecursive(text, 0);\nconst offsets = [];\nlet position = 0;\nfor (const piece of pieces) {\n  offsets.push(position);\n  position += piece.length;\n}\n\n// Rolling window over the pieces: returns the [start, end] character range of each chunk\nconst roll = (size) => {\n  const ranges = [];\n  let first = 0;\n  while (first < pieces.length) {\n    let last = first;\n    let length = pieces[first].length;\n    while (last + 1 < pieces.length && length + pieces[last + 1].length <= size) {\n      last += 1;\n      length += pieces[last].length;\n    }\n    ranges.push([offsets[first], offsets[last] + pieces[last].length]);\n    if (last >= pieces.length - 1) break;\n\n    // Roll back so the next window starts with about OVERLAP characters of this one\n    let next = last + 1;\n    let shared = 0;\n    while (next - 1 > first && shared + pieces[next - 1].length <= OVERLAP) {\n      next -= 1;\n      shared += pieces[next].length;\n    }\n    first = next;\n  }\n  return ranges;\n};\n\n// Window size: aim for about one chunk per page, kept between 10 and 100 chunks under 100 pages\nconst bounded = pageCount < 100;\nconst target = bounded ? Math.min(MAX_CHUNKS, Math.max(MIN_CHUNKS, pageCount)) : pageCount;\nlet size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.ceil(text.length / target) + OVERLAP));\nlet ranges = roll(size);\n\nif (bounded) {\n  let guard = 0;\n  while (ranges.length > MAX_CHUNKS && size < MAX_SIZE && guard < 40) {\n    size = Math.min(MAX_SIZE, Math.ceil(size * 1.1));\n    ranges = roll(size);\n    guard += 1;\n  }\n  while (ranges.length < MIN_CHUNKS && size > MIN_SIZE && guard < 80) {\n    size = Math.max(MIN_SIZE, Math.floor(size * 0.85));\n    ranges = roll(size);\n    guard += 1;\n  }\n}\n\nconst pageAt = (offset) => {\n  let page = pageStarts.length > 0 ? pageStarts[0].page : 1;\n  for (const entry of pageStarts) {\n    if (entry.start <= offset) page = entry.page;\n    else break;\n  }\n  return page;\n};\n\nconst out = [];\nranges.forEach(([start, end]) => {\n  const content = text.slice(start, end).trim();\n  if (content.length === 0) return;\n  out.push({\n    json: {\n      content,\n      source: doc.source,\n      chunkIndex: out.length,\n      pageStart: pageAt(start),\n      pageEnd: pageAt(Math.max(start, end - 1)),\n      charStart: start,\n      charEnd: end,\n      windowSize: size,\n      before: text.slice(Math.max(0, start - CONTEXT), start).trim(),\n      after: text.slice(end, end + CONTEXT).trim(),\n    },\n  });\n});\n\nreturn out;' }, position: [660, 200], notes: 'Splits the whole document recursively on paragraphs, lines, sentences and words, then rolls a window of 1000 characters with about 200 characters of overlap. Outputs one item per chunk with its page range and neighbouring text.' }
});

const loop_Over_Chunk_Batches = node({
  type: 'n8n-nodes-base.splitInBatches',
  version: 3,
  config: { name: 'Loop Over Chunk Batches', parameters: { batchSize: 10, options: {} }, position: [880, 200] }
});

const count_Stored_Chunks = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Count Stored Chunks', parameters: { operation: 'executeQuery', query: 'SELECT count(*)::int AS chunk_count FROM documents WHERE metadata->>\'source\' = $1;', options: { queryReplacement: expr('{{ [ $(\'Upload Document\').first().json.Document?.filename ?? $(\'Upload Document\').first().json.Document?.[0]?.filename ?? \'unknown\' ] }}') } }, credentials: { postgres: newCredential('Postgres') }, position: [1120, 60], executeOnce: true }
});

const log_Ingestion_in_Supabase = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: { name: 'Log Ingestion in Supabase', parameters: { tableId: 'rag_sources', fieldsUi: { fieldValues: [{ fieldId: 'file_name', fieldValue: expr('{{ $(\'Upload Document\').first().json.Document?.filename ?? $(\'Upload Document\').first().json.Document?.[0]?.filename ?? \'unknown\' }}') }, { fieldId: 'chunk_count', fieldValue: expr('{{ $json.chunk_count }}') }] } }, credentials: { supabaseApi: newCredential('Supabase') }, position: [1340, 60] }
});

const enrich_Chunk = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: { name: 'Enrich Chunk', parameters: { promptType: 'define', text: expr('Document: {{ $json.source }}\n\nText before the passage:\n"""\n{{ $json.before }}\n"""\n\nPASSAGE:\n"""\n{{ $json.content }}\n"""\n\nText after the passage:\n"""\n{{ $json.after }}\n"""'), hasOutputParser: true, messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You prepare passages of a book for a retrieval system. You receive one PASSAGE with the text that comes before and after it. Describe only the PASSAGE; use the surrounding text only to understand it. Return these fields. context: one or two sentences that situate the passage in the document and say what it is about, so the passage can be understood on its own. hypothetical_questions: three distinct questions a reader could ask that this passage answers. keywords: five to eight key terms or short phrases from the passage. entities: the named things in the passage, each with a name and a type among PERSON, COMPANY, ORGANIZATION, REGULATION, FORM, FINANCIAL_CONCEPT, METRIC, OTHER. relations: up to six facts stated explicitly in the passage, each as subject, relation, object, where subject and object are entities you listed. Write in the language of the passage. Do not invent facts and do not copy long parts of the passage.' }] }, batching: { batchSize: 5, delayBetweenBatches: 0 } }, position: [1120, 340], onError: 'continueRegularOutput', subnodes: { model: enrichment_Model, outputParser: enrichment_Parser } }
});

const build_Enriched_Chunks = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Enriched Chunks', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const results = $input.all();\nconst list = (value) => (Array.isArray(value) ? value : []);\nconst out = [];\n\nfor (let i = 0; i < results.length; i++) {\n  let chunk;\n  try {\n    chunk = $(\'Loop Over Chunk Batches\').itemMatching(i).json;\n  } catch (error) {\n    chunk = $(\'Loop Over Chunk Batches\').all()[i]?.json;\n  }\n  if (!chunk) continue;\n\n  const output = results[i].json.output || {};\n  const context = typeof output.context === \'string\' ? output.context.trim() : \'\';\n  const enriched = context.length > 0;\n\n  const questions = list(output.hypothetical_questions).map(String).slice(0, 5);\n  const keywords = list(output.keywords).map(String).slice(0, 10);\n  const entities = list(output.entities)\n    .filter((e) => e && e.name)\n    .map((e) => ({ name: String(e.name), type: String(e.type || \'OTHER\') }))\n    .slice(0, 15);\n  const relations = list(output.relations)\n    .filter((r) => r && r.subject && r.object)\n    .map((r) => ({ subject: String(r.subject), relation: String(r.relation || \'\'), object: String(r.object) }))\n    .slice(0, 10);\n\n  // Text that gets embedded: context, original passage, questions and keywords\n  const parts = [];\n  if (enriched) parts.push(\'Context: \' + context);\n  parts.push(chunk.content);\n  if (questions.length > 0) parts.push(\'Questions: \' + questions.join(\' | \'));\n  if (keywords.length > 0) parts.push(\'Keywords: \' + keywords.join(\', \'));\n\n  out.push({\n    json: {\n      text: parts.join(\'\\n\\n\'),\n      source: chunk.source,\n      chunkIndex: chunk.chunkIndex,\n      pageStart: chunk.pageStart,\n      pageEnd: chunk.pageEnd,\n      context,\n      questions,\n      keywords,\n      entities,\n      relations,\n      enriched,\n    },\n  });\n}\n\nreturn out;' }, position: [1420, 340], notes: 'Merges each chunk with the enrichment returned by the model. Builds the text to embed from the context, the passage, the questions and the keywords. Falls back to the plain passage when the model failed.' }
});

const embed_One_Chunk = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: { name: 'Embed One Chunk', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: 'pyNBw6XbD5faF0Zm', cachedResultName: 'Insiders Dossier RAG' }, workflowInputs: { mappingMode: 'defineBelow', value: { content: expr('{{ $json.text }}'), source: expr('{{ $json.source }}'), page: expr('{{ $json.pageStart }}'), pageEnd: expr('{{ $json.pageEnd }}'), chunkIndex: expr('{{ $json.chunkIndex }}'), context: expr('{{ $json.context }}'), questions: expr('{{ $json.questions }}'), keywords: expr('{{ $json.keywords }}'), entities: expr('{{ $json.entities }}'), relations: expr('{{ $json.relations }}'), enriched: expr('{{ $json.enriched }}') }, matchingColumns: [], schema: [{ id: 'content', displayName: 'content', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }, { id: 'source', displayName: 'source', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }, { id: 'page', displayName: 'page', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' }, { id: 'pageEnd', displayName: 'pageEnd', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' }, { id: 'chunkIndex', displayName: 'chunkIndex', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' }, { id: 'context', displayName: 'context', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }, { id: 'questions', displayName: 'questions', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'array' }, { id: 'keywords', displayName: 'keywords', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'array' }, { id: 'entities', displayName: 'entities', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'array' }, { id: 'relations', displayName: 'relations', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'array' }, { id: 'enriched', displayName: 'enriched', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'boolean' }], attemptToConvertTypes: false }, options: { waitForSubWorkflow: true } }, position: [1640, 340] }
});

const chat_Message = trigger({
  type: '@n8n/n8n-nodes-langchain.chatTrigger',
  version: 1.5,
  config: { name: 'Chat Message', parameters: { options: {} }, position: [0, 800] }
});

const inputs = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Inputs', parameters: { mode: 'manual', assignments: { assignments: [{ id: 'in-question', name: 'question', value: expr('{{ $json.chatInput }}'), type: 'string' }, { id: 'in-session', name: 'sessionId', value: expr('{{ $json.sessionId }}'), type: 'string' }, { id: 'in-history', name: 'historyLimit', value: 10, type: 'number' }, { id: 'in-topk', name: 'searchTopK', value: 10, type: 'number' }, { id: 'in-passages', name: 'answerPassages', value: 5, type: 'number' }, { id: 'in-minscore', name: 'minRerankScore', value: 4, type: 'number' }] }, includeOtherFields: false, options: {} }, position: [220, 800] }
});

const get_Session_Messages = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Get Session Messages', parameters: { operation: 'executeQuery', query: 'SELECT role, content, created_at\nFROM chat_messages\nWHERE session_id = $1\nORDER BY created_at DESC, id DESC\nLIMIT $2;', options: { queryReplacement: expr('{{ [ $json.sessionId, $json.historyLimit ] }}') } }, credentials: { postgres: newCredential('Postgres') }, position: [440, 800], alwaysOutputData: true }
});

const empty_Conversation = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Empty Conversation', parameters: { conditions: { combinator: 'and', options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ id: 'empty-history', leftValue: expr('{{ $json.content ?? \'\' }}'), rightValue: '', operator: { type: 'string', operation: 'empty', singleValue: true } }] }, looseTypeValidation: true, options: {} }, position: [660, 800] }
});

const load_Document_Catalog = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Load Document Catalog', parameters: { operation: 'executeQuery', query: 'SELECT metadata->>\'source\' AS source,\n       count(*)::int AS chunks,\n       min(coalesce((metadata->>\'page\')::int, (metadata->\'loc\'->>\'pageNumber\')::int)) AS first_page,\n       max(coalesce((metadata->>\'page_end\')::int, (metadata->>\'page\')::int, (metadata->\'loc\'->>\'pageNumber\')::int)) AS last_page\nFROM documents\nGROUP BY 1\nORDER BY 1;', options: {} }, credentials: { postgres: newCredential('Postgres') }, position: [1100, 800], executeOnce: true, alwaysOutputData: true }
});

const route_Question = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: { name: 'Route Question', parameters: { promptType: 'define', text: expr('Conversation so far:\n{{ $(\'Format History\').isExecuted ? $(\'Format History\').first().json.history : \'(no previous message)\' }}\n\nQuestion: {{ $(\'Inputs\').first().json.question }}\n\nAvailable documents:\n{{ $(\'Load Document Catalog\').all().filter(i => i.json.source).map(i => \'- \' + i.json.source + \' (pages \' + i.json.first_page + \' to \' + i.json.last_page + \', \' + i.json.chunks + \' chunks)\').join(\'\\n\') || \'- none\' }}'), hasOutputParser: true, messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You route a question to a document search system. The documents are written in English. You also receive the conversation so far. Return these fields. standalone_question: the question rewritten so it can be understood alone, in its original language; use the conversation to resolve pronouns and follow-up questions such as \'and for sales?\'. queries: three different search queries in English that would find passages answering the standalone question; make the first a direct translation, the second a reformulation with other words, and the third a short hypothetical sentence that could appear in the document as the answer. keywords: three to six distinctive English terms or short phrases expected in relevant passages; avoid generic words. filters: source is the exact file name of one available document only if the question clearly targets it, otherwise an empty string; page_from and page_to are page numbers only if the question names pages, otherwise 0.' }] } }, position: [1320, 800], executeOnce: true, onError: 'continueRegularOutput', subnodes: { model: route_Model, outputParser: route_Parser } }
});

const build_Search_Queries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Search Queries', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const routed = $input.first().json.output || {};\nconst original = $(\'Chat Message\').first().json.chatInput;\n\nconst standalone = typeof routed.standalone_question === \'string\' ? routed.standalone_question.trim() : \'\';\nconst question = standalone.length > 0 ? standalone : original;\n\nconst generated = Array.isArray(routed.queries) ? routed.queries : [];\nconst queries = [...new Set([question, ...generated].map((q) => String(q).trim()).filter((q) => q.length > 0))].slice(0, 4);\n\nreturn queries.map((query, queryIndex) => ({ json: { query, queryIndex } }));' }, position: [1640, 800], notes: 'Turns the routing result into one item per search query. Always includes the question itself, so the search still works when the router failed.' }
});

const vector_Search = node({
  type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase',
  version: 1.3,
  config: { name: 'Vector Search', parameters: { mode: 'load', tableName: { __rl: true, mode: 'id', value: 'documents' }, prompt: expr('{{ $json.query }}'), topK: expr('{{ $(\'Inputs\').first().json.searchTopK }}'), includeDocumentMetadata: true, options: { queryName: 'match_documents' } }, credentials: { supabaseApi: newCredential('Supabase') }, position: [1860, 800], alwaysOutputData: true, subnodes: { embedding: embed_Query } }
});

const keyword_Search = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Keyword Search', parameters: { operation: 'executeQuery', query: 'SELECT d.content,\n       d.metadata,\n       ts_rank(to_tsvector(\'english\', d.content), websearch_to_tsquery(\'english\', $1)) AS rank\nFROM documents d\nWHERE to_tsvector(\'english\', d.content) @@ websearch_to_tsquery(\'english\', $1)\n  AND ($2 = \'\' OR d.metadata->>\'source\' = $2)\n  AND ($3 = 0 OR coalesce((d.metadata->>\'page_end\')::int, (d.metadata->>\'page\')::int, (d.metadata->\'loc\'->>\'pageNumber\')::int) >= $3)\n  AND ($4 = 0 OR coalesce((d.metadata->>\'page\')::int, (d.metadata->\'loc\'->>\'pageNumber\')::int) <= $4)\nORDER BY rank DESC\nLIMIT 20;', options: { queryReplacement: expr('{{ [ ($(\'Route Question\').first().json.output?.keywords ?? []).join(\' OR \'), $(\'Route Question\').first().json.output?.filters?.source ?? \'\', Number($(\'Route Question\').first().json.output?.filters?.page_from) || 0, Number($(\'Route Question\').first().json.output?.filters?.page_to) || 0 ] }}') } }, credentials: { postgres: newCredential('Postgres') }, position: [2080, 800], executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput' }
});

const merge_Search_Results = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Merge Search Results', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const routed = $(\'Route Question\').first().json.output || {};\nconst original = $(\'Chat Message\').first().json.chatInput;\n\nconst standalone = typeof routed.standalone_question === \'string\' ? routed.standalone_question.trim() : \'\';\nconst question = standalone.length > 0 ? standalone : original;\nconst keywords = (Array.isArray(routed.keywords) ? routed.keywords : []).map(String);\n\n// Filters chosen by the router\nconst filters = routed.filters || {};\nconst source = filters.source ? String(filters.source) : \'\';\nconst pageFrom = Number(filters.page_from) || 0;\nconst pageTo = Number(filters.page_to) || 0;\n\nconst firstPage = (m) => {\n  const page = m?.page ?? m?.loc?.pageNumber;\n  return page == null ? null : Number(page);\n};\nconst lastPage = (m) => {\n  const page = m?.page_end ?? firstPage(m);\n  return page == null ? null : Number(page);\n};\nconst passes = (m) => {\n  if (source && m?.source !== source) return false;\n  if (pageFrom && (lastPage(m) == null || lastPage(m) < pageFrom)) return false;\n  if (pageTo && (firstPage(m) == null || firstPage(m) > pageTo)) return false;\n  return true;\n};\n\n// Vector results of all queries: filter, remove duplicates, best similarity first\nconst seen = new Map();\nconst vector = [];\nfor (const item of $(\'Vector Search\').all()) {\n  const document = item.json.document;\n  if (!document || !document.pageContent) continue;\n  if (!passes(document.metadata)) continue;\n  const key = String(document.pageContent).slice(0, 200);\n  const score = Number(item.json.score) || 0;\n  const existing = seen.get(key);\n  if (existing) {\n    existing.score = Math.max(existing.score, score);\n    continue;\n  }\n  const entry = { key, text: String(document.pageContent), metadata: document.metadata || {}, score };\n  seen.set(key, entry);\n  vector.push(entry);\n}\nvector.sort((a, b) => b.score - a.score);\n\n// Keyword results, already filtered and ranked by Postgres\nconst keyword = $input\n  .all()\n  .filter((item) => item.json && item.json.content)\n  .map((item) => ({\n    key: String(item.json.content).slice(0, 200),\n    text: String(item.json.content),\n    metadata: item.json.metadata || {},\n    rank: Number(item.json.rank) || 0,\n  }));\n\n// Reciprocal rank fusion of the two lists\nconst K = 60;\nconst pool = new Map();\nconst add = (entry, position, kind) => {\n  let candidate = pool.get(entry.key);\n  if (!candidate) {\n    candidate = { text: entry.text, metadata: entry.metadata, fusion: 0, vectorScore: null, keywordRank: null, foundBy: [] };\n    pool.set(entry.key, candidate);\n  }\n  candidate.fusion += 1 / (K + position + 1);\n  if (kind === \'vector\') candidate.vectorScore = entry.score;\n  else candidate.keywordRank = entry.rank;\n  candidate.foundBy.push(kind);\n};\nvector.forEach((entry, position) => add(entry, position, \'vector\'));\nkeyword.forEach((entry, position) => add(entry, position, \'keyword\'));\n\nconst candidates = [...pool.values()]\n  .sort((a, b) => b.fusion - a.fusion)\n  .slice(0, 20)\n  .map((candidate, index) => ({\n    index,\n    text: candidate.text,\n    page: firstPage(candidate.metadata),\n    pageEnd: lastPage(candidate.metadata),\n    source: candidate.metadata.source || \'\',\n    vectorScore: candidate.vectorScore,\n    keywordRank: candidate.keywordRank,\n    foundBy: candidate.foundBy,\n  }));\n\n// One numbered block per passage, shortened so the reranking prompt stays small\nconst numbered = candidates\n  .map((candidate) => \'[\' + candidate.index + \'] \' + candidate.text.slice(0, 1500).replace(/\\s+/g, \' \'))\n  .join(\'\\n\\n\');\n\nreturn [\n  {\n    json: {\n      question,\n      originalQuestion: original,\n      keywords,\n      filters: { source, pageFrom, pageTo },\n      candidates,\n      numbered: numbered.length > 0 ? numbered : \'No passage was found.\',\n      candidateCount: candidates.length,\n      vectorCount: vector.length,\n      keywordCount: keyword.length,\n    },\n  },\n];' }, position: [2300, 800], notes: 'Gathers the retrieved passages into one numbered list for the reranking model and keeps their page and similarity score.' }
});

const rerank_Passages = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: { name: 'Rerank Passages', parameters: { promptType: 'define', text: expr('Question: {{ $json.question }}\n\nPassages:\n{{ $json.numbered }}'), hasOutputParser: true, messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You are a reranker for a retrieval system. You receive a question and numbered passages. Score every passage from 0 to 10 for how useful it is to answer the question: 10 means it directly answers it, 5 means it is related but incomplete, 0 means it is irrelevant. Judge only the content, not the order of the passages. Return one entry per passage with its index and its score.' }] } }, position: [2520, 800], onError: 'continueRegularOutput', subnodes: { model: rerank_Model, outputParser: rerank_Parser } }
});

const select_Top_Passages = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Select Top Passages', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const config = $(\'Inputs\').first().json;\nconst TOP = Number(config.answerPassages) || 5;          // passages given to the answering model\nconst MIN_SCORE = Number(config.minRerankScore ?? 4);    // passages scored below this are dropped\n\nconst prepared = $(\'Merge Search Results\').first().json;\nconst ranking = $input.first().json.output?.ranking;\n\nlet selected;\nlet reranked = false;\n\nif (Array.isArray(ranking) && ranking.length > 0) {\n  const scores = new Map();\n  for (const entry of ranking) {\n    const index = Number(entry.index);\n    const score = Number(entry.score);\n    if (Number.isInteger(index) && !Number.isNaN(score)) scores.set(index, score);\n  }\n  selected = prepared.candidates\n    .filter((candidate) => scores.has(candidate.index))\n    .map((candidate) => ({ ...candidate, rerankScore: scores.get(candidate.index) }))\n    .sort((a, b) => b.rerankScore - a.rerankScore)\n    .filter((candidate) => candidate.rerankScore >= MIN_SCORE)\n    .slice(0, TOP);\n  reranked = true;\n} else {\n  // Reranker failed: keep the fused search order\n  selected = prepared.candidates.slice(0, TOP).map((candidate) => ({ ...candidate, rerankScore: null }));\n}\n\nconst label = (candidate) => {\n  if (!candidate.page) return \'page unknown\';\n  if (candidate.pageEnd && candidate.pageEnd !== candidate.page) return \'pages \' + candidate.page + \'-\' + candidate.pageEnd;\n  return \'page \' + candidate.page;\n};\n\nconst context = selected\n  .map((candidate, position) => \'[Passage \' + (position + 1) + \' | \' + label(candidate) + \']\\n\' + candidate.text)\n  .join(\'\\n\\n---\\n\\n\');\n\nreturn [\n  {\n    json: {\n      question: prepared.question,\n      context: context.length > 0 ? context : \'No relevant passage was found.\',\n      passageCount: selected.length,\n      candidateCount: prepared.candidateCount,\n      reranked,\n      sources: selected.map((candidate) => ({\n        page: candidate.page,\n        pageEnd: candidate.pageEnd,\n        rerankScore: candidate.rerankScore,\n        vectorScore: candidate.vectorScore,\n        keywordRank: candidate.keywordRank,\n        foundBy: candidate.foundBy,\n      })),\n    },\n  },\n];' }, position: [2840, 800], notes: 'Sorts the passages by the reranking score, keeps the best five above the minimum score and builds the context for the answer. Falls back to the vector order when the reranker failed.' }
});

const write_Answer = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: { name: 'Write Answer', parameters: { promptType: 'define', text: expr('Question: {{ $json.question }}\n\nPassages:\n{{ $json.context }}'), hasOutputParser: false, messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: 'You answer questions about a book using only the passages provided. Write the answer in your own words and do not copy long parts of the passages. Cite the page or pages in parentheses after each claim, using the page labels of the passages. If the passages do not contain the answer, say so plainly and do not guess. Reply in the language of the question. Be concise.' }] } }, position: [3060, 800], subnodes: { model: answer_Model } }
});

const save_Conversation = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Save Conversation', parameters: { operation: 'executeQuery', query: 'INSERT INTO chat_messages (session_id, role, content)\nVALUES ($1, \'user\', $2), ($1, \'assistant\', $3)\nRETURNING id;', options: { queryReplacement: expr('{{ [ $(\'Inputs\').first().json.sessionId, $(\'Inputs\').first().json.question, $json.text ] }}') } }, credentials: { postgres: newCredential('Postgres') }, position: [3380, 800], executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput' }
});

const reply = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Reply', parameters: { mode: 'manual', assignments: { assignments: [{ id: 'reply-output', name: 'output', value: expr('{{ $(\'Write Answer\').first().json.text }}'), type: 'string' }] }, includeOtherFields: false, options: {} }, position: [3600, 800], executeOnce: true }
});

const format_History = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Format History', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: 'const messages = $input\n  .all()\n  .map((item) => item.json)\n  .filter((message) => message.content)\n  .reverse();\n\nconst history = messages\n  .map((message) => (message.role === \'assistant\' ? \'Assistant\' : \'User\') + \': \' + String(message.content).slice(0, 800))\n  .join(\'\\n\');\n\nreturn [{ json: { history, messageCount: messages.length } }];' }, position: [880, 960], notes: 'Puts the previous messages of the session back in chronological order and formats them as one text for the router.' }
});

const receive_Chunk = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Receive Chunk', parameters: { inputSource: 'workflowInputs', workflowInputs: { values: [{ name: 'content', type: 'string' }, { name: 'source', type: 'string' }, { name: 'page', type: 'number' }, { name: 'pageEnd', type: 'number' }, { name: 'chunkIndex', type: 'number' }, { name: 'context', type: 'string' }, { name: 'questions', type: 'array' }, { name: 'keywords', type: 'array' }, { name: 'entities', type: 'array' }, { name: 'relations', type: 'array' }, { name: 'enriched', type: 'boolean' }] } }, position: [2140, 320] }
});

const store_Chunk_in_Supabase = node({
  type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase',
  version: 1.3,
  config: { name: 'Store Chunk in Supabase', parameters: { mode: 'insert', tableName: { __rl: true, mode: 'id', value: 'documents' }, options: { queryName: 'match_documents' } }, credentials: { supabaseApi: newCredential('Supabase') }, position: [2380, 320], subnodes: { embedding: embed_Chunk, documentLoader: chunk_Loader } }
});

const wf = workflow('pyNBw6XbD5faF0Zm', 'Insiders Dossier RAG', { description: 'Embeds an uploaded PDF into a Supabase vector store, logs each ingestion, and answers chat questions with retrieval over the stored chunks.', executionOrder: 'v1', timezone: 'Europe/Paris', availableInMCP: true, binaryMode: 'separate' });

export default wf
  .add(upload_Document)
  .to(extract_PDF_Text)
  .to(clean_Text)
  .to(recursive_Rolling_Chunks)
  .to(splitInBatches(loop_Over_Chunk_Batches)
  .onEachBatch(enrich_Chunk
    .to(build_Enriched_Chunks)
    .to(embed_One_Chunk)
    .to(nextBatch(loop_Over_Chunk_Batches)))
  .onDone(count_Stored_Chunks
    .to(log_Ingestion_in_Supabase)))
  .add(chat_Message)
  .to(inputs)
  .to(get_Session_Messages)
  .to(empty_Conversation.onTrue(load_Document_Catalog
    .to(route_Question)
    .to(build_Search_Queries)
    .to(vector_Search)
    .to(keyword_Search)
    .to(merge_Search_Results)
    .to(rerank_Passages)
    .to(select_Top_Passages)
    .to(write_Answer)
    .to(save_Conversation)
    .to(reply)).onFalse(format_History
    .to(load_Document_Catalog)))
  .add(sticky('## Setup\n\n- Supabase credential on the Supabase nodes, Postgres credential on Count Stored Chunks.\n- Tables `documents` and `rag_sources` and the function `match_documents` must exist in Supabase (vector size 1536).\n- Gemini Flash runs the chat and the enrichment. OpenAI runs the embeddings. Both use n8n credits.', [], { name: 'Sticky Note 775bb253', color: 2, width: 360, height: 300, position: [-416, 144] }))
  .add(sticky('## Ingestion\n\n1. The PDF text is extracted, cleaned and joined into one continuous text.\n2. **Recursive Rolling Chunks** splits it recursively and rolls a window with about 200 characters of overlap. The window size adapts to the document: about one chunk per page, and always 10 to 100 chunks under 100 pages. Chunks are not tied to pages.\n3. Chunks go through the loop in batches of 10. **Enrich Chunk** asks Gemini Flash for the context, hypothetical questions, keywords, entities and relations of each chunk.\n4. **Embed One Chunk** calls this same workflow once per chunk, through **Receive Chunk**, which embeds and stores it.\n\nEach batch is stored before the next one starts.', [], { name: 'Sticky Note d67a4bbe', color: 3, width: 360, height: 180, position: [-416, 480] }))
  .add(sticky('## Answering\n\n1. **Context**: Inputs holds the question and the config. Get Session Messages loads the previous messages of the session. Load Document Catalog lists the stored documents.\n2. **Routing**: Route Question (Gemini Flash) returns a standalone question, search queries, keywords and filters.\n3. **Search**: Vector Search runs once per query. Keyword Search runs a full text search. Merge Search Results fuses both lists.\n4. **Reranking**: Rerank Passages (Gemini Flash Lite) scores the 20 best candidates. Select Top Passages keeps the best ones.\n5. **Generation**: Write Answer uses those passages only and cites the pages. Save Conversation stores the exchange.', [], { name: 'Sticky Note 14106821', color: 3, width: 360, position: [-416, 768] }))
  .add(receive_Chunk)
  .to(store_Chunk_in_Supabase)