CREATE EXTENSION IF NOT EXISTS vector;

-- DOC RAG
CREATE TABLE IF NOT EXISTS doc_document (
  id          bigserial PRIMARY KEY,
  title       text,
  source_path text NOT NULL,
  sha256      text UNIQUE,
  created_at  timestamptz DEFAULT now(),
  metadata    jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS doc_chunk (
  id          bigserial PRIMARY KEY,
  document_id bigint NOT NULL REFERENCES doc_document(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  page_start  int,
  page_end    int,
  text        text NOT NULL,
  embedding   vector(1024) NOT NULL,
  metadata    jsonb DEFAULT '{}'::jsonb,
  tsv         tsvector
);

CREATE INDEX IF NOT EXISTS idx_doc_chunk_docid ON doc_chunk(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunk_vec
ON doc_chunk USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_doc_chunk_tsv ON doc_chunk USING gin(tsv);

-- DOC TABLE (extracted tables from PDFs)
CREATE TABLE IF NOT EXISTS doc_table (
  id                      bigserial PRIMARY KEY,
  document_id             bigint NOT NULL REFERENCES doc_document(id) ON DELETE CASCADE,
  table_index             int NOT NULL,
  page_start              int,
  page_end                int,
  title                   text DEFAULT '',
  html                    text,
  data_json               jsonb DEFAULT '{}'::jsonb,
  text_summary            text,
  text_summary_embedding  vector(1024),
  metadata                jsonb DEFAULT '{}'::jsonb,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_table_docid ON doc_table(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_table_vec 
ON doc_table USING ivfflat (text_summary_embedding vector_cosine_ops) WITH (lists = 100);

-- SCHEMA CATALOG
CREATE SCHEMA IF NOT EXISTS schema_catalog;

CREATE TABLE IF NOT EXISTS schema_catalog.tables (
  table_name     text PRIMARY KEY,
  business_label text,
  description    text,
  tags           jsonb DEFAULT '{}'::jsonb,
  sensitivity    text DEFAULT 'normal',
  is_allowed     boolean DEFAULT true,
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schema_catalog.columns (
  table_name  text NOT NULL REFERENCES schema_catalog.tables(table_name) ON DELETE CASCADE,
  column_name text NOT NULL,
  data_type   text,
  is_nullable boolean,
  description text,
  synonyms    jsonb DEFAULT '[]'::jsonb,
  PRIMARY KEY (table_name, column_name)
);

CREATE TABLE IF NOT EXISTS schema_catalog.fk (
  constraint_name text PRIMARY KEY,
  source_table    text NOT NULL,
  source_column   text NOT NULL,
  target_table    text NOT NULL,
  target_column   text NOT NULL,
  UNIQUE (source_table, source_column, target_table, target_column)
);

CREATE INDEX IF NOT EXISTS idx_fk_source ON schema_catalog.fk(source_table);
CREATE INDEX IF NOT EXISTS idx_fk_target ON schema_catalog.fk(target_table);

CREATE TABLE IF NOT EXISTS schema_catalog.embeddings (
  object_type  text NOT NULL,
  object_id    text NOT NULL,
  table_name   text NOT NULL,
  content_text text NOT NULL,
  embedding    vector(1024) NOT NULL,
  PRIMARY KEY (object_type, object_id)
);

CREATE INDEX IF NOT EXISTS idx_schema_embeddings_vec
ON schema_catalog.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
