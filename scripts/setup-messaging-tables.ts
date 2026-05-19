import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupMessagingTables() {
  console.log('Setting up messaging tables...')

  // Check if tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('internal_conversations')
    .select('id')
    .limit(1)

  if (tablesError?.code === '42P01') {
    console.log('Tables do not exist, creating...')
    
    // Create tables using raw SQL
    const createTablesSql = `
      -- Tabla de conversaciones de mensajería interna
      CREATE TABLE IF NOT EXISTS internal_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Participantes de conversación
      CREATE TABLE IF NOT EXISTS internal_conversation_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES internal_conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
      );

      -- Mensajes internos
      CREATE TABLE IF NOT EXISTS internal_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES internal_conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Índices
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON internal_conversation_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON internal_conversation_participants(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation ON internal_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON internal_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_created ON internal_messages(created_at DESC);
    `

    // Note: We need to run this SQL through Supabase dashboard or use pg directly
    console.log('Please run the following SQL in Supabase dashboard:')
    console.log(createTablesSql)
  } else if (tablesError) {
    console.error('Error checking tables:', tablesError)
  } else {
    console.log('Tables already exist')
  }
}

setupMessagingTables()
