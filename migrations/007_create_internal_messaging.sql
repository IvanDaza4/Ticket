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

-- RLS
ALTER TABLE internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversaciones
CREATE POLICY "Users can view conversations they participate in" ON internal_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians and admins can create conversations" ON internal_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('technician', 'admin')
    )
  );

-- Políticas para participantes
CREATE POLICY "Users can view participants of their conversations" ON internal_conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_conversation_participants p
      WHERE p.conversation_id = conversation_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians and admins can add participants" ON internal_conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('technician', 'admin')
    )
  );

CREATE POLICY "Users can update their own participation" ON internal_conversation_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para mensajes
CREATE POLICY "Users can view messages in their conversations" ON internal_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM internal_conversation_participants
      WHERE conversation_id = internal_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON internal_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM internal_conversation_participants
      WHERE conversation_id = internal_messages.conversation_id
      AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Función para actualizar updated_at en conversación
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE internal_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON internal_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Función para obtener conteo de mensajes no leídos
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM internal_messages m
  JOIN internal_conversation_participants p ON p.conversation_id = m.conversation_id
  WHERE p.user_id = p_user_id
  AND m.sender_id != p_user_id
  AND m.created_at > COALESCE(p.last_read_at, '1970-01-01');
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;
