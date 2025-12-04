-- ============================================
-- CHESS E-COMMERCE DATABASE SETUP
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. TAULA DE CATEGORIES
CREATE TABLE IF NOT EXISTS public.shop_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- nom de l'icona de lucide-react
  image_url TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA DE PRODUCTES
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10, 2) CHECK (sale_price >= 0 AND sale_price < price),
  sku TEXT UNIQUE,
  images TEXT[] DEFAULT '{}', -- array d'URLs d'imatges
  specifications JSONB DEFAULT '{}', -- { "material": "fusta", "mida": "50x50cm" }
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  weight DECIMAL(10, 2), -- pes en kg per càlcul d'enviament
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAULA D'INVENTARI (tracking detallat)
CREATE TABLE IF NOT EXISTS public.shop_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
  quantity_available INTEGER DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
  last_restocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- 4. TAULA DE CISTELLA
CREATE TABLE IF NOT EXISTS public.shop_cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 5. TAULA D'ADRECES
CREATE TABLE IF NOT EXISTS public.shop_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ES',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TAULA DE COMANDES
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Preus
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  
  -- Adreça d'enviament (desnormalitzada per mantenir historial)
  shipping_full_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state_province TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  
  -- Pagament
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- Tracking
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAULA D'ARTICLES DE COMANDA
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  
  -- Dades del producte (desnormalitzades per mantenir historial)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TAULA DE RESSENYES
CREATE TABLE IF NOT EXISTS public.shop_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- ÍNDEXS PER MILLORAR RENDIMENT
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.shop_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.shop_products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.shop_products(is_featured);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.shop_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON public.shop_cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.shop_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.shop_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.shop_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.shop_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.shop_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.shop_reviews(is_approved);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.shop_addresses(user_id);

-- ============================================
-- FUNCIONS I TRIGGERS
-- ============================================

-- Funció per actualitzar updated_at automàticament
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers per updated_at
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_cart_items_updated_at BEFORE UPDATE ON public.shop_cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_reviews_updated_at BEFORE UPDATE ON public.shop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funció per generar número de comanda únic
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Format: ORD-YYYYMMDD-XXXX (exemple: ORD-20231123-0001)
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Comprova si ja existeix
    SELECT EXISTS(SELECT 1 FROM public.shop_orders WHERE order_number = new_number) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger per generar order_number automàticament
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_shop_order_number BEFORE INSERT ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Funció per decrementar estoc de producte
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.shop_products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id AND stock_quantity >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estoc insuficient per al producte %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTIQUES DE SEGURETAT (ROW LEVEL SECURITY)
-- ============================================

-- Categories: Tothom pot llegir
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.shop_categories FOR SELECT USING (true);

-- Productes: Tothom pot llegir productes actius
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products" ON public.shop_products 
  FOR SELECT USING (is_active = true);

-- Inventari: Només lectura pública
ALTER TABLE public.shop_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inventory" ON public.shop_inventory FOR SELECT USING (true);

-- Cistella: Només el propi usuari
ALTER TABLE public.shop_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cart" ON public.shop_cart_items 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart items" ON public.shop_cart_items 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.shop_cart_items 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON public.shop_cart_items 
  FOR DELETE USING (auth.uid() = user_id);

-- Adreces: Només el propi usuari
ALTER TABLE public.shop_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own addresses" ON public.shop_addresses 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.shop_addresses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.shop_addresses 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.shop_addresses 
  FOR DELETE USING (auth.uid() = user_id);

-- Comandes: Només el propi usuari
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON public.shop_orders 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.shop_orders 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Articles de comanda: Només si l'usuari és propietari de la comanda
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own order items" ON public.shop_order_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_orders 
      WHERE shop_orders.id = shop_order_items.order_id 
      AND shop_orders.user_id = auth.uid()
    )
  );

-- Ressenyes: Tothom pot llegir aprovades, només propi usuari pot crear/editar
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved reviews" ON public.shop_reviews 
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can read own reviews" ON public.shop_reviews 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.shop_reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.shop_reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- DADES INICIALS - CATEGORIES
-- ============================================

INSERT INTO public.shop_categories (name, slug, description, icon, "order") VALUES
  ('Taulers', 'taulers', 'Taulers d''escacs de fusta, plàstic i materials premium', 'Grid3x3', 1),
  ('Peces', 'peces', 'Peces d''escacs de diferents materials i estils', 'Crown', 2),
  ('Rellotges', 'rellotges', 'Rellotges d''escacs digitals i analògics', 'Clock', 3),
  ('Llibres', 'llibres', 'Llibres d''obertures, tàctiques i estratègia', 'Book', 4),
  ('Software', 'software', 'Programes d''anàlisi i entrenament', 'Laptop', 5),
  ('Cursos', 'cursos', 'Cursos online i materials d''aprenentatge', 'GraduationCap', 6),
  ('Roba', 'roba', 'Samarretes, gorres i roba d''escacs', 'Shirt', 7),
  ('Complements', 'complements', 'Bosses, clauers i accessoris', 'ShoppingBag', 8),
  ('Material d''Oficina', 'material-oficina', 'Llibretes, bolígrafs i material escolar amb temàtica d''escacs', 'Pencil', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- HABILITAR REALTIME (opcional)
-- ============================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_cart_items;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_orders;
