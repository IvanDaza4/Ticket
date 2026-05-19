-- Tabla para feedback/calificación de tickets
CREATE TABLE IF NOT EXISTS ticket_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id) -- Solo un feedback por ticket
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_ticket_id ON ticket_feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_rating ON ticket_feedback(rating);

-- RLS
ALTER TABLE ticket_feedback ENABLE ROW LEVEL SECURITY;

-- Política: Clientes pueden crear feedback de sus propios tickets
CREATE POLICY "Clients can create feedback for their tickets" ON ticket_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND t.created_by = auth.uid()
      AND t.status = 'resolved'
    )
  );

-- Política: Todos pueden ver feedback
CREATE POLICY "Anyone can view feedback" ON ticket_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Actualizar ticket cuando se crea feedback (cerrar automáticamente)
CREATE OR REPLACE FUNCTION close_ticket_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets
  SET status = 'closed', closed_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_close_ticket_on_feedback
  AFTER INSERT ON ticket_feedback
  FOR EACH ROW
  EXECUTE FUNCTION close_ticket_on_feedback();
