-- ================================================================
-- QUẢN LÝ PHÒNG TRỌ - Supabase Database Schema
-- Chạy file này trong Supabase SQL Editor
-- URL: https://app.supabase.com → Project → SQL Editor
-- ================================================================

-- Enable RLS (Row Level Security) - bảo vệ dữ liệu theo user
-- Mỗi user chỉ xem/sửa được dữ liệu của mình

-- ----------------------------------------------------------------
-- 1. SETTINGS - Cài đặt đơn giá dịch vụ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  electricity_price NUMERIC DEFAULT 3500,    -- VNĐ/kWh
  water_price       NUMERIC DEFAULT 15000,   -- VNĐ/m3
  trash_fee         NUMERIC DEFAULT 20000,   -- VNĐ/phòng/tháng
  wifi_fee          NUMERIC DEFAULT 50000,   -- VNĐ/phòng/tháng
  bank_account_name   TEXT,
  bank_account_number TEXT,
  bank_name           TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 2. ROOMS - Danh sách phòng trọ
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  default_price NUMERIC NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own rooms" ON public.rooms
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON public.rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- ----------------------------------------------------------------
-- 3. TENANTS - Khách thuê (có thể nhiều khách theo thời gian)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id          UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  id_card_number   TEXT,
  vehicle_plate    TEXT,
  deposit          NUMERIC DEFAULT 0,
  start_date       DATE NOT NULL,
  end_date         DATE,           -- NULL = đang ở
  id_card_image_url TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own tenants" ON public.tenants
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tenants_room_id ON public.tenants(room_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(room_id, end_date) WHERE end_date IS NULL;

-- ----------------------------------------------------------------
-- 4. INVOICES - Hóa đơn theo tháng
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id          UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  billing_month    INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
  billing_year     INTEGER NOT NULL,
  -- Tiền phòng
  room_fee         NUMERIC DEFAULT 0,
  -- Điện
  elec_old_index   NUMERIC DEFAULT 0,
  elec_new_index   NUMERIC DEFAULT 0,
  elec_consumption NUMERIC DEFAULT 0,
  elec_unit_price  NUMERIC DEFAULT 0,
  elec_total       NUMERIC DEFAULT 0,
  -- Nước
  water_old_index  NUMERIC DEFAULT 0,
  water_new_index  NUMERIC DEFAULT 0,
  water_consumption NUMERIC DEFAULT 0,
  water_unit_price  NUMERIC DEFAULT 0,
  water_total       NUMERIC DEFAULT 0,
  -- Dịch vụ cố định
  trash_fee        NUMERIC DEFAULT 0,
  wifi_fee         NUMERIC DEFAULT 0,
  -- Phụ phí / giảm trừ
  surcharge        NUMERIC DEFAULT 0,
  surcharge_note   TEXT,
  discount         NUMERIC DEFAULT 0,
  -- Tổng
  total_amount     NUMERIC DEFAULT 0,
  -- Trạng thái
  status           TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  -- Ràng buộc: 1 phòng chỉ có 1 hóa đơn/tháng
  UNIQUE (room_id, billing_month, billing_year)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.invoices(billing_year, billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_room_id ON public.invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- ----------------------------------------------------------------
-- 5. Updated_at triggers (auto-update timestamps)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- ✅ DONE! Bây giờ vào Authentication > Settings > bật "Enable email confirmations" theo ý muốn
-- ----------------------------------------------------------------
