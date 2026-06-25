-- ============================================================
-- BETHMOR TAXONOMY
-- Adds parent_id + level to categories and seeds the full
-- three-level hierarchy.
--
-- Level 1 = main category  (13 entries)
-- Level 2 = facet / sub-category
-- Level 3 = value (leaf; used primarily for Stock Music facets)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add new columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS level     smallint NOT NULL DEFAULT 1;

-- Mark all pre-existing rows as level 1
UPDATE public.categories SET level = 1 WHERE level IS NULL OR level = 0;

-- ─────────────────────────────────────────────────────────────
-- 2. Self-referencing FK for parent_id
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.categories(id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Replace global slug/name unique constraints with
--    partial-scoped ones (unique within parent)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Root-level uniqueness (level 1): slug and name globally unique among roots
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug_root
  ON public.categories (slug)
  WHERE parent_id IS NULL;

-- Child-level uniqueness (levels 2–3): unique within each parent
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug_per_parent
  ON public.categories (slug, parent_id)
  WHERE parent_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. Seed full Bethmor taxonomy
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- ── Level-1 IDs ─────────────────────────────────────────────
  v_stock_video         uuid;
  v_video_assets        uuid;
  v_stock_music         uuid;
  v_sound_assets        uuid;
  v_graphic_assets      uuid;
  v_graphic_elements    uuid;
  v_presentation_assets uuid;
  v_stock_photos        uuid;
  v_fonts               uuid;
  v_web_assets          uuid;
  v_cms_assets          uuid;
  v_wordpress_assets    uuid;
  v_3d_assets           uuid;

  -- ── Video Assets sub-categories (level-2) ───────────────────
  v_broadcast_packages  uuid;
  v_va_elements         uuid;
  v_va_infographics     uuid;
  v_logo_stings         uuid;
  v_openers             uuid;
  v_product_promo       uuid;
  v_titles              uuid;
  v_video_displays      uuid;
  v_motion_graphics     uuid;

  -- ── Stock Music facets (level-2) ────────────────────────────
  v_mood                uuid;
  v_genre               uuid;
  v_theme               uuid;
  v_tempo               uuid;
  v_instrument          uuid;
  v_vocals              uuid;
  v_era                 uuid;

  -- ── Sound Assets sub-categories (level-2) ───────────────────
  v_game_sounds         uuid;
  v_transitions_move    uuid;
  v_domestic_sounds     uuid;
  v_human_sounds        uuid;
  v_urban_sounds        uuid;
  v_nature_sounds       uuid;
  v_futuristic_sounds   uuid;
  v_interface_sounds    uuid;
  v_cartoon_sounds      uuid;
  v_industrial_sounds   uuid;
  v_sound_packs         uuid;
  v_misc_sounds         uuid;
  v_random_sounds       uuid;

  -- ── Graphic Assets sub-categories (level-2) ─────────────────
  v_backgrounds         uuid;
  v_textures            uuid;
  v_vectors             uuid;
  v_patterns            uuid;
  v_ga_icons            uuid;
  v_objects             uuid;
  v_illustrations       uuid;

  -- ── Graphic Elements sub-categories (level-2) ───────────────
  v_for_print           uuid;
  v_product_mockups     uuid;
  v_websites            uuid;
  v_ux_ui_kits          uuid;
  v_ge_infographics     uuid;
  v_logos               uuid;
  v_scene_generators    uuid;
  v_social_media        uuid;

  -- ── Presentation Assets sub-categories (level-2) ─────────────
  v_keynote             uuid;
  v_powerpoint          uuid;
  v_google_slides       uuid;

BEGIN

  -- ============================================================
  -- LEVEL 1: Main categories
  -- ON CONFLICT: update name/sort_order/level so re-runs are safe.
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Stock Video', 'stock-video', 1, 1, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_stock_video FROM public.categories WHERE slug = 'stock-video' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Video Assets', 'video-assets', 1, 2, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_video_assets FROM public.categories WHERE slug = 'video-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Stock Music', 'stock-music', 1, 3, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_stock_music FROM public.categories WHERE slug = 'stock-music' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Sound Assets', 'sound-assets', 1, 4, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_sound_assets FROM public.categories WHERE slug = 'sound-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Graphic Assets', 'graphic-assets', 1, 5, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_graphic_assets FROM public.categories WHERE slug = 'graphic-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Graphic Elements', 'graphic-elements', 1, 6, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_graphic_elements FROM public.categories WHERE slug = 'graphic-elements' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Presentation Assets', 'presentation-assets', 1, 7, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_presentation_assets FROM public.categories WHERE slug = 'presentation-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Stock Photos', 'stock-photos', 1, 8, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_stock_photos FROM public.categories WHERE slug = 'stock-photos' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Fonts', 'fonts', 1, 9, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_fonts FROM public.categories WHERE slug = 'fonts' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('Web Assets', 'web-assets', 1, 10, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_web_assets FROM public.categories WHERE slug = 'web-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('CMS Assets', 'cms-assets', 1, 11, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_cms_assets FROM public.categories WHERE slug = 'cms-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('WordPress Assets', 'wordpress-assets', 1, 12, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_wordpress_assets FROM public.categories WHERE slug = 'wordpress-assets' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
    VALUES ('3D Assets', '3d-assets', 1, 13, true)
    ON CONFLICT (slug) WHERE parent_id IS NULL
    DO UPDATE SET name = EXCLUDED.name, level = 1, sort_order = EXCLUDED.sort_order, is_active = true;
  SELECT id INTO v_3d_assets FROM public.categories WHERE slug = '3d-assets' AND parent_id IS NULL;

  -- ============================================================
  -- LEVEL 2: Video Assets sub-categories
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Broadcast Packages', 'broadcast-packages', 2, v_video_assets, 1, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_broadcast_packages FROM public.categories WHERE slug = 'broadcast-packages' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Elements', 'elements', 2, v_video_assets, 2, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_va_elements FROM public.categories WHERE slug = 'elements' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Infographics', 'infographics', 2, v_video_assets, 3, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_va_infographics FROM public.categories WHERE slug = 'infographics' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Logo Stings', 'logo-stings', 2, v_video_assets, 4, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_logo_stings FROM public.categories WHERE slug = 'logo-stings' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Openers', 'openers', 2, v_video_assets, 5, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_openers FROM public.categories WHERE slug = 'openers' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Product Promo', 'product-promo', 2, v_video_assets, 6, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_product_promo FROM public.categories WHERE slug = 'product-promo' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Titles', 'titles', 2, v_video_assets, 7, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_titles FROM public.categories WHERE slug = 'titles' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Video Displays', 'video-displays', 2, v_video_assets, 8, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_video_displays FROM public.categories WHERE slug = 'video-displays' AND parent_id = v_video_assets;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Motion Graphics', 'motion-graphics', 2, v_video_assets, 9, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_motion_graphics FROM public.categories WHERE slug = 'motion-graphics' AND parent_id = v_video_assets;

  -- ============================================================
  -- LEVEL 2: Stock Music facets
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Mood', 'mood', 2, v_stock_music, 1, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_mood FROM public.categories WHERE slug = 'mood' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Genre', 'genre', 2, v_stock_music, 2, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_genre FROM public.categories WHERE slug = 'genre' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Theme', 'theme', 2, v_stock_music, 3, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_theme FROM public.categories WHERE slug = 'theme' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Tempo', 'tempo', 2, v_stock_music, 4, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_tempo FROM public.categories WHERE slug = 'tempo' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Instrument', 'instrument', 2, v_stock_music, 5, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_instrument FROM public.categories WHERE slug = 'instrument' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Vocals', 'vocals', 2, v_stock_music, 6, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_vocals FROM public.categories WHERE slug = 'vocals' AND parent_id = v_stock_music;

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active)
    VALUES ('Era', 'era', 2, v_stock_music, 7, true)
    ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;
  SELECT id INTO v_era FROM public.categories WHERE slug = 'era' AND parent_id = v_stock_music;

  -- ============================================================
  -- LEVEL 3: Stock Music — Mood values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Upbeat/Energetic',     'upbeat-energetic',     3, v_mood,  1, true),
    ('Happy/Cheerful',       'happy-cheerful',        3, v_mood,  2, true),
    ('Inspiring/Uplifting',  'inspiring-uplifting',   3, v_mood,  3, true),
    ('Epic/Powerful',        'epic-powerful',         3, v_mood,  4, true),
    ('Dramatic/Emotional',   'dramatic-emotional',    3, v_mood,  5, true),
    ('Chill/Mellow',         'chill-mellow',          3, v_mood,  6, true),
    ('Funny/Quirky',         'funny-quirky',          3, v_mood,  7, true),
    ('Angry/Aggressive',     'angry-aggressive',      3, v_mood,  8, true),
    ('Dark/Suspenseful',     'dark-suspenseful',      3, v_mood,  9, true),
    ('Relaxing/Peaceful',    'relaxing-peaceful',     3, v_mood, 10, true),
    ('Romantic/Sentimental', 'romantic-sentimental',  3, v_mood, 11, true),
    ('Sad/Somber',           'sad-somber',            3, v_mood, 12, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Genre values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Cinematic',           'cinematic',           3, v_genre,  1, true),
    ('Corporate',           'corporate',           3, v_genre,  2, true),
    ('Hip hop/Rap',         'hip-hop-rap',         3, v_genre,  3, true),
    ('Rock',                'rock',                3, v_genre,  4, true),
    ('Electronic',          'electronic',          3, v_genre,  5, true),
    ('Ambient',             'ambient',             3, v_genre,  6, true),
    ('Funk',                'funk',                3, v_genre,  7, true),
    ('Classical',           'classical',           3, v_genre,  8, true),
    ('Blues',               'blues',               3, v_genre,  9, true),
    ('Children/Kids',       'children-kids',       3, v_genre, 10, true),
    ('Chiptune',            'chiptune',            3, v_genre, 11, true),
    ('Country',             'country',             3, v_genre, 12, true),
    ('Dance/EDM',           'dance-edm',           3, v_genre, 13, true),
    ('Dubstep',             'dubstep',             3, v_genre, 14, true),
    ('Folk',                'folk',                3, v_genre, 15, true),
    ('Future Bass',         'future-bass',         3, v_genre, 16, true),
    ('House',               'house',               3, v_genre, 17, true),
    ('Indie',               'indie',               3, v_genre, 18, true),
    ('Jazz',                'jazz',                3, v_genre, 19, true),
    ('Latin',               'latin',               3, v_genre, 20, true),
    ('Lofi',                'lofi',                3, v_genre, 21, true),
    ('Lounge',              'lounge',              3, v_genre, 22, true),
    ('Metal',               'metal',               3, v_genre, 23, true),
    ('Orchestral Hybrid',   'orchestral-hybrid',   3, v_genre, 24, true),
    ('Percussive',          'percussive',          3, v_genre, 25, true),
    ('Pop',                 'pop',                 3, v_genre, 26, true),
    ('R&B and Soul',        'rnb-soul',            3, v_genre, 27, true),
    ('Reggae',              'reggae',              3, v_genre, 28, true),
    ('Techno',              'techno',              3, v_genre, 29, true),
    ('Trap',                'trap',                3, v_genre, 30, true),
    ('World',               'world',               3, v_genre, 31, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Theme values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Corporate',    'corporate',   3, v_theme,  1, true),
    ('Documentary',  'documentary', 3, v_theme,  2, true),
    ('Action',       'action',      3, v_theme,  3, true),
    ('Lifestyle',    'lifestyle',   3, v_theme,  4, true),
    ('Sports',       'sports',      3, v_theme,  5, true),
    ('Drama',        'drama',       3, v_theme,  6, true),
    ('Nature',       'nature',      3, v_theme,  7, true),
    ('Technology',   'technology',  3, v_theme,  8, true),
    ('Celebration',  'celebration', 3, v_theme,  9, true),
    ('Comedy',       'comedy',      3, v_theme, 10, true),
    ('Family',       'family',      3, v_theme, 11, true),
    ('Romance',      'romance',     3, v_theme, 12, true),
    ('Sci-Fi/Fantasy', 'sci-fi-fantasy', 3, v_theme, 13, true),
    ('Showbiz',      'showbiz',     3, v_theme, 14, true),
    ('Travel',       'travel',      3, v_theme, 15, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Tempo values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Very Slow (Below 60 BPM)', 'very-slow',   3, v_tempo, 1, true),
    ('Slow (60–90 BPM)',         'slow',        3, v_tempo, 2, true),
    ('Medium (90–110 BPM)',      'medium',      3, v_tempo, 3, true),
    ('Upbeat (110–140 BPM)',     'upbeat',      3, v_tempo, 4, true),
    ('Fast (140–160 BPM)',       'fast',        3, v_tempo, 5, true),
    ('Very Fast (160+ BPM)',     'very-fast',   3, v_tempo, 6, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Instrument values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Piano',           'piano',          3, v_instrument,  1, true),
    ('Acoustic Guitar', 'acoustic-guitar',3, v_instrument,  2, true),
    ('Violin',          'violin',         3, v_instrument,  3, true),
    ('Bass',            'bass',           3, v_instrument,  4, true),
    ('Cello',           'cello',          3, v_instrument,  5, true),
    ('Drums',           'drums',          3, v_instrument,  6, true),
    ('Percussion',      'percussion',     3, v_instrument,  7, true),
    ('Electric Guitar', 'electric-guitar',3, v_instrument,  8, true),
    ('Accordion',       'accordion',      3, v_instrument,  9, true),
    ('Banjo',           'banjo',          3, v_instrument, 10, true),
    ('Bells',           'bells',          3, v_instrument, 11, true),
    ('Brass',           'brass',          3, v_instrument, 12, true),
    ('Clarinet',        'clarinet',       3, v_instrument, 13, true),
    ('Double Bass',     'double-bass',    3, v_instrument, 14, true),
    ('Flute',           'flute',          3, v_instrument, 15, true),
    ('Harmonica',       'harmonica',      3, v_instrument, 16, true),
    ('Harp',            'harp',           3, v_instrument, 17, true),
    ('Keyboard',        'keyboard',       3, v_instrument, 18, true),
    ('Mallets',         'mallets',        3, v_instrument, 19, true),
    ('Organ',           'organ',          3, v_instrument, 20, true),
    ('Plucked',         'plucked',        3, v_instrument, 21, true),
    ('Saxophone',       'saxophone',      3, v_instrument, 22, true),
    ('Sound Effects',   'sound-effects',  3, v_instrument, 23, true),
    ('Strings',         'strings',        3, v_instrument, 24, true),
    ('Synth',           'synth',          3, v_instrument, 25, true),
    ('Trumpet',         'trumpet',        3, v_instrument, 26, true),
    ('Ukulele',         'ukulele',        3, v_instrument, 27, true),
    ('Woodwinds',       'woodwinds',      3, v_instrument, 28, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Vocals values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('No Vocals',           'no-vocals',           3, v_vocals, 1, true),
    ('Background Vocals',   'background-vocals',   3, v_vocals, 2, true),
    ('Female Vocals',       'female-vocals',       3, v_vocals, 3, true),
    ('Lead Vocals',         'lead-vocals',         3, v_vocals, 4, true),
    ('Vocal Samples',       'vocal-samples',       3, v_vocals, 5, true),
    ('Male Vocals',         'male-vocals',         3, v_vocals, 6, true),
    ('Instrumental Included','instrumental-included',3, v_vocals, 7, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 3: Stock Music — Era values
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('2000s',           '2000s',           3, v_era, 1, true),
    ('80s & 90s',       '80s-90s',         3, v_era, 2, true),
    ('60s & 70s',       '60s-70s',         3, v_era, 3, true),
    ('50s and earlier', '50s-and-earlier', 3, v_era, 4, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 2: Sound Assets sub-categories
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Game Sounds',           'game-sounds',            2, v_sound_assets,  1, true),
    ('Transitions & Movement','transitions-and-movement',2, v_sound_assets,  2, true),
    ('Domestic Sounds',       'domestic-sounds',         2, v_sound_assets,  3, true),
    ('Human Sounds',          'human-sounds',            2, v_sound_assets,  4, true),
    ('Urban Sounds',          'urban-sounds',            2, v_sound_assets,  5, true),
    ('Nature Sounds',         'nature-sounds',           2, v_sound_assets,  6, true),
    ('Futuristic Sounds',     'futuristic-sounds',       2, v_sound_assets,  7, true),
    ('Interface Sounds',      'interface-sounds',        2, v_sound_assets,  8, true),
    ('Cartoon Sounds',        'cartoon-sounds',          2, v_sound_assets,  9, true),
    ('Industrial Sounds',     'industrial-sounds',       2, v_sound_assets, 10, true),
    ('Sound Packs',           'sound-packs',             2, v_sound_assets, 11, true),
    ('Miscellaneous',         'miscellaneous',           2, v_sound_assets, 12, true),
    ('Random Sounds',         'random-sounds',           2, v_sound_assets, 13, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 2: Graphic Assets sub-categories
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Backgrounds',   'backgrounds',  2, v_graphic_assets, 1, true),
    ('Textures',      'textures',     2, v_graphic_assets, 2, true),
    ('Vectors',       'vectors',      2, v_graphic_assets, 3, true),
    ('Patterns',      'patterns',     2, v_graphic_assets, 4, true),
    ('Icons',         'icons',        2, v_graphic_assets, 5, true),
    ('Objects',       'objects',      2, v_graphic_assets, 6, true),
    ('Illustrations', 'illustrations',2, v_graphic_assets, 7, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 2: Graphic Elements sub-categories
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('For Print',        'for-print',       2, v_graphic_elements, 1, true),
    ('Product Mockups',  'product-mockups', 2, v_graphic_elements, 2, true),
    ('Websites',         'websites',        2, v_graphic_elements, 3, true),
    ('UX/UI Kits',       'ux-ui-kits',      2, v_graphic_elements, 4, true),
    ('Infographics',     'infographics',    2, v_graphic_elements, 5, true),
    ('Logos',            'logos',           2, v_graphic_elements, 6, true),
    ('Scene Generators', 'scene-generators',2, v_graphic_elements, 7, true),
    ('Social Media',     'social-media',    2, v_graphic_elements, 8, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 2: Presentation Assets sub-categories
  -- ============================================================

  INSERT INTO public.categories (name, slug, level, parent_id, sort_order, is_active) VALUES
    ('Keynote',       'keynote',       2, v_presentation_assets, 1, true),
    ('PowerPoint',    'powerpoint',    2, v_presentation_assets, 2, true),
    ('Google Slides', 'google-slides', 2, v_presentation_assets, 3, true)
  ON CONFLICT (slug, parent_id) WHERE parent_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- LEVEL 2: IDs captured for level-3 (not needed here but
  -- variables declared above in case future values are added)
  -- ============================================================
  SELECT id INTO v_game_sounds       FROM public.categories WHERE slug = 'game-sounds'       AND parent_id = v_sound_assets;
  SELECT id INTO v_transitions_move  FROM public.categories WHERE slug = 'transitions-and-movement' AND parent_id = v_sound_assets;
  SELECT id INTO v_domestic_sounds   FROM public.categories WHERE slug = 'domestic-sounds'   AND parent_id = v_sound_assets;
  SELECT id INTO v_human_sounds      FROM public.categories WHERE slug = 'human-sounds'      AND parent_id = v_sound_assets;
  SELECT id INTO v_urban_sounds      FROM public.categories WHERE slug = 'urban-sounds'      AND parent_id = v_sound_assets;
  SELECT id INTO v_nature_sounds     FROM public.categories WHERE slug = 'nature-sounds'     AND parent_id = v_sound_assets;
  SELECT id INTO v_futuristic_sounds FROM public.categories WHERE slug = 'futuristic-sounds' AND parent_id = v_sound_assets;
  SELECT id INTO v_interface_sounds  FROM public.categories WHERE slug = 'interface-sounds'  AND parent_id = v_sound_assets;
  SELECT id INTO v_cartoon_sounds    FROM public.categories WHERE slug = 'cartoon-sounds'    AND parent_id = v_sound_assets;
  SELECT id INTO v_industrial_sounds FROM public.categories WHERE slug = 'industrial-sounds' AND parent_id = v_sound_assets;
  SELECT id INTO v_sound_packs       FROM public.categories WHERE slug = 'sound-packs'       AND parent_id = v_sound_assets;
  SELECT id INTO v_misc_sounds       FROM public.categories WHERE slug = 'miscellaneous'     AND parent_id = v_sound_assets;
  SELECT id INTO v_random_sounds     FROM public.categories WHERE slug = 'random-sounds'     AND parent_id = v_sound_assets;

  SELECT id INTO v_backgrounds    FROM public.categories WHERE slug = 'backgrounds'   AND parent_id = v_graphic_assets;
  SELECT id INTO v_textures       FROM public.categories WHERE slug = 'textures'      AND parent_id = v_graphic_assets;
  SELECT id INTO v_vectors        FROM public.categories WHERE slug = 'vectors'       AND parent_id = v_graphic_assets;
  SELECT id INTO v_patterns       FROM public.categories WHERE slug = 'patterns'      AND parent_id = v_graphic_assets;
  SELECT id INTO v_ga_icons       FROM public.categories WHERE slug = 'icons'         AND parent_id = v_graphic_assets;
  SELECT id INTO v_objects        FROM public.categories WHERE slug = 'objects'       AND parent_id = v_graphic_assets;
  SELECT id INTO v_illustrations  FROM public.categories WHERE slug = 'illustrations' AND parent_id = v_graphic_assets;

  SELECT id INTO v_for_print       FROM public.categories WHERE slug = 'for-print'       AND parent_id = v_graphic_elements;
  SELECT id INTO v_product_mockups FROM public.categories WHERE slug = 'product-mockups' AND parent_id = v_graphic_elements;
  SELECT id INTO v_websites        FROM public.categories WHERE slug = 'websites'        AND parent_id = v_graphic_elements;
  SELECT id INTO v_ux_ui_kits      FROM public.categories WHERE slug = 'ux-ui-kits'     AND parent_id = v_graphic_elements;
  SELECT id INTO v_ge_infographics FROM public.categories WHERE slug = 'infographics'    AND parent_id = v_graphic_elements;
  SELECT id INTO v_logos           FROM public.categories WHERE slug = 'logos'           AND parent_id = v_graphic_elements;
  SELECT id INTO v_scene_generators FROM public.categories WHERE slug = 'scene-generators' AND parent_id = v_graphic_elements;
  SELECT id INTO v_social_media    FROM public.categories WHERE slug = 'social-media'    AND parent_id = v_graphic_elements;

  SELECT id INTO v_keynote       FROM public.categories WHERE slug = 'keynote'       AND parent_id = v_presentation_assets;
  SELECT id INTO v_powerpoint    FROM public.categories WHERE slug = 'powerpoint'    AND parent_id = v_presentation_assets;
  SELECT id INTO v_google_slides FROM public.categories WHERE slug = 'google-slides' AND parent_id = v_presentation_assets;

END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Migrate existing resources to the closest new main category
--
-- Resources whose category_id points to a pre-taxonomy flat category
-- (i.e., not one of the 13 new root slugs) are re-assigned by
-- matching the old category's name against common patterns.
-- The catch-all destination is 'graphic-elements'.
-- ─────────────────────────────────────────────────────────────

UPDATE public.resources r
SET category_id = (
  SELECT nc.id
  FROM public.categories nc
  WHERE nc.parent_id IS NULL
    AND nc.is_active  = true
    AND nc.slug = (
      CASE
        WHEN oc.name ILIKE '%stock video%' OR oc.name ILIKE '%footage%'
          THEN 'stock-video'
        WHEN oc.name ILIKE '%video%' OR oc.name ILIKE '%motion%' OR oc.name ILIKE '%animation%'
          THEN 'video-assets'
        WHEN oc.name ILIKE '%music%' OR oc.name ILIKE '%audio track%'
          THEN 'stock-music'
        WHEN oc.name ILIKE '%sound%' OR oc.name ILIKE '%sfx%' OR oc.name ILIKE '%audio%'
          THEN 'sound-assets'
        WHEN oc.name ILIKE '%photo%' OR oc.name ILIKE '%stock image%'
          THEN 'stock-photos'
        WHEN oc.name ILIKE '%font%' OR oc.name ILIKE '%typeface%' OR oc.name ILIKE '%typography%'
          THEN 'fonts'
        WHEN oc.name ILIKE '%presentation%' OR oc.name ILIKE '%slide%'
          OR oc.name ILIKE '%keynote%' OR oc.name ILIKE '%powerpoint%'
          THEN 'presentation-assets'
        WHEN oc.name ILIKE '%3d%'
          THEN '3d-assets'
        WHEN oc.name ILIKE '%wordpress%'
          THEN 'wordpress-assets'
        WHEN oc.name ILIKE '%cms%'
          THEN 'cms-assets'
        WHEN oc.name ILIKE '%web%' OR oc.name ILIKE '%html%' OR oc.name ILIKE '%landing%'
          THEN 'web-assets'
        WHEN oc.name ILIKE '%icon%' OR oc.name ILIKE '%texture%' OR oc.name ILIKE '%vector%'
          OR oc.name ILIKE '%background%' OR oc.name ILIKE '%pattern%'
          OR oc.name ILIKE '%illustration%'
          THEN 'graphic-assets'
        ELSE 'graphic-elements'
      END
    )
  LIMIT 1
)
FROM public.categories oc
WHERE r.category_id = oc.id
  AND oc.slug NOT IN (
    'stock-video', 'video-assets', 'stock-music', 'sound-assets',
    'graphic-assets', 'graphic-elements', 'presentation-assets',
    'stock-photos', 'fonts', 'web-assets', 'cms-assets',
    'wordpress-assets', '3d-assets'
  );

-- ─────────────────────────────────────────────────────────────
-- 6. Deactivate legacy flat categories no longer in the taxonomy
--    (only safe to do after resources have been re-assigned above)
-- ─────────────────────────────────────────────────────────────

UPDATE public.categories
SET is_active = false
WHERE parent_id IS NULL
  AND slug NOT IN (
    'stock-video', 'video-assets', 'stock-music', 'sound-assets',
    'graphic-assets', 'graphic-elements', 'presentation-assets',
    'stock-photos', 'fonts', 'web-assets', 'cms-assets',
    'wordpress-assets', '3d-assets'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.resources res WHERE res.category_id = public.categories.id
  );
