-- Tabla para registrar tiempo dedicado a cada ticket
CREATE TABLE IF NOT EXISTS ticket_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  description TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_time_entries_ticket ON ticket_time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_technician ON ticket_time_entries(technician_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON ticket_time_entries(entry_date);

-- RLS
ALTER TABLE ticket_time_entries ENABLE ROW LEVEL SECURITY;

-- Política: Técnicos pueden crear entradas de tiempo
CREATE POLICY "Technicians can create time entries" ON ticket_time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Política: Todos pueden ver entradas
CREATE POLICY "Anyone can view time entries" ON ticket_time_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Agregar campo hours_used a contracts si no existe
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS hours_used DECIMAL(6,2) DEFAULT 0;

-- Función para calcular horas usadas por organización en el mes actual
CREATE OR REPLACE FUNCTION get_organization_hours_used(org_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_hours DECIMAL;
BEGIN
  SELECT COALESCE(SUM(tte.hours), 0)
  INTO total_hours
  FROM ticket_time_entries tte
  JOIN tickets t ON tte.ticket_id = t.id
  WHERE t.organization_id = org_id
  AND tte.entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND tte.entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- Vista para obtener resumen de horas por organización
CREATE OR REPLACE VIEW organization_hours_summary AS
SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  c.monthly_hours AS contracted_hours,
  COALESCE(SUM(tte.hours), 0) AS hours_used,
  c.monthly_hours - COALESCE(SUM(tte.hours), 0) AS hours_remaining
FROM organizations o
LEFT JOIN contracts c ON c.organization_id = o.id AND c.is_active = true
LEFT JOIN tickets t ON t.organization_id = o.id
LEFT JOIN ticket_time_entries tte ON tte.ticket_id = t.id
  AND tte.entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND tte.entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY o.id, o.name, c.monthly_hours;
