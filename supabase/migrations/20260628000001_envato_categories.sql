-- ============================================================
-- Envato-aligned category restructure
--
-- Part A: Replace 13 legacy level-1 categories with 11 new
--         top-level buckets aligned to Envato Elements.
--         Level-2+ sub-categories are kept intact under new parents.
--
-- Old level-1 slugs:
--   stock-video, video-assets, stock-music, sound-assets, graphic-assets,
--   graphic-elements, presentation-assets, stock-photos, fonts, web-assets,
--   cms-assets, wordpress-assets, 3d-assets
--
-- New level-1 slugs:
--   graphic-templates, video, music, sound-effects, photos, fonts (keep),
--   add-ons, web-templates, presentations, 3d, graphic-elements (keep)
-- ============================================================

DO $$
DECLARE
  -- new level-1 ids
  v_graphic_templates uuid;
  v_video             uuid;
  v_music             uuid;
  v_sound_effects     uuid;
  v_photos            uuid;
  v_add_ons           uuid;
  v_web_templates     uuid;
  v_presentations     uuid;
  v_3d                uuid;

BEGIN

  -- ─────────────────────────────────────────────────────────────
  -- 1. Insert new level-1 categories
  -- ─────────────────────────────────────────────────────────────

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Graphic Templates', 'graphic-templates', 1, 1,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Video',             'video',             1, 2,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Music',             'music',             1, 3,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Sound Effects',     'sound-effects',     1, 4,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Photos',            'photos',            1, 5,  true)
  ON CONFLICT DO NOTHING;

  -- 'fonts' already exists as level-1 — just update sort_order
  UPDATE public.categories SET sort_order = 6, name = 'Fonts' WHERE slug = 'fonts' AND parent_id IS NULL;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Add-ons',           'add-ons',           1, 7,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Web Templates',     'web-templates',     1, 8,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('Presentations',     'presentations',     1, 9,  true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (name, slug, level, sort_order, is_active)
  VALUES ('3D',                '3d',                1, 10, true)
  ON CONFLICT DO NOTHING;

  -- 'graphic-elements' already exists as level-1 — just update sort_order
  UPDATE public.categories SET sort_order = 11, name = 'Graphic Elements' WHERE slug = 'graphic-elements' AND parent_id IS NULL;

  -- ─────────────────────────────────────────────────────────────
  -- 2. Capture new level-1 IDs
  -- ─────────────────────────────────────────────────────────────

  SELECT id INTO v_graphic_templates FROM public.categories WHERE slug = 'graphic-templates' AND parent_id IS NULL;
  SELECT id INTO v_video             FROM public.categories WHERE slug = 'video'             AND parent_id IS NULL;
  SELECT id INTO v_music             FROM public.categories WHERE slug = 'music'             AND parent_id IS NULL;
  SELECT id INTO v_sound_effects     FROM public.categories WHERE slug = 'sound-effects'     AND parent_id IS NULL;
  SELECT id INTO v_photos            FROM public.categories WHERE slug = 'photos'            AND parent_id IS NULL;
  SELECT id INTO v_add_ons           FROM public.categories WHERE slug = 'add-ons'           AND parent_id IS NULL;
  SELECT id INTO v_web_templates     FROM public.categories WHERE slug = 'web-templates'     AND parent_id IS NULL;
  SELECT id INTO v_presentations     FROM public.categories WHERE slug = 'presentations'     AND parent_id IS NULL;
  SELECT id INTO v_3d                FROM public.categories WHERE slug = '3d'                AND parent_id IS NULL;

  -- ─────────────────────────────────────────────────────────────
  -- 3. Reparent level-2 children from old level-1 to new level-1
  -- ─────────────────────────────────────────────────────────────

  -- stock-video → video
  UPDATE public.categories
  SET parent_id = v_video
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'stock-video' AND parent_id IS NULL);

  -- video-assets → video
  UPDATE public.categories
  SET parent_id = v_video
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'video-assets' AND parent_id IS NULL);

  -- stock-music → music
  UPDATE public.categories
  SET parent_id = v_music
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'stock-music' AND parent_id IS NULL);

  -- sound-assets → sound-effects
  UPDATE public.categories
  SET parent_id = v_sound_effects
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'sound-assets' AND parent_id IS NULL);

  -- graphic-assets → graphic-templates
  UPDATE public.categories
  SET parent_id = v_graphic_templates
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'graphic-assets' AND parent_id IS NULL);

  -- presentation-assets → presentations
  UPDATE public.categories
  SET parent_id = v_presentations
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'presentation-assets' AND parent_id IS NULL);

  -- stock-photos → photos
  UPDATE public.categories
  SET parent_id = v_photos
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'stock-photos' AND parent_id IS NULL);

  -- web-assets → web-templates
  UPDATE public.categories
  SET parent_id = v_web_templates
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'web-assets' AND parent_id IS NULL);

  -- cms-assets → add-ons
  UPDATE public.categories
  SET parent_id = v_add_ons
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'cms-assets' AND parent_id IS NULL);

  -- wordpress-assets → add-ons
  UPDATE public.categories
  SET parent_id = v_add_ons
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = 'wordpress-assets' AND parent_id IS NULL);

  -- 3d-assets → 3d
  UPDATE public.categories
  SET parent_id = v_3d
  WHERE parent_id = (SELECT id FROM public.categories WHERE slug = '3d-assets' AND parent_id IS NULL);

  -- ─────────────────────────────────────────────────────────────
  -- 4. Migrate resources pointing directly to old level-1 categories
  -- ─────────────────────────────────────────────────────────────

  -- stock-video resources → video
  UPDATE public.resources
  SET category_id = v_video
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'stock-video' AND parent_id IS NULL);

  -- video-assets resources → video
  UPDATE public.resources
  SET category_id = v_video
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'video-assets' AND parent_id IS NULL);

  -- stock-music resources → music
  UPDATE public.resources
  SET category_id = v_music
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'stock-music' AND parent_id IS NULL);

  -- sound-assets resources → sound-effects
  UPDATE public.resources
  SET category_id = v_sound_effects
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'sound-assets' AND parent_id IS NULL);

  -- graphic-assets resources → graphic-templates
  UPDATE public.resources
  SET category_id = v_graphic_templates
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'graphic-assets' AND parent_id IS NULL);

  -- presentation-assets resources → presentations
  UPDATE public.resources
  SET category_id = v_presentations
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'presentation-assets' AND parent_id IS NULL);

  -- stock-photos resources → photos
  UPDATE public.resources
  SET category_id = v_photos
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'stock-photos' AND parent_id IS NULL);

  -- web-assets resources → web-templates
  UPDATE public.resources
  SET category_id = v_web_templates
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'web-assets' AND parent_id IS NULL);

  -- cms-assets resources → add-ons
  UPDATE public.resources
  SET category_id = v_add_ons
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'cms-assets' AND parent_id IS NULL);

  -- wordpress-assets resources → add-ons
  UPDATE public.resources
  SET category_id = v_add_ons
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'wordpress-assets' AND parent_id IS NULL);

  -- 3d-assets resources → 3d
  UPDATE public.resources
  SET category_id = v_3d
  WHERE category_id = (SELECT id FROM public.categories WHERE slug = '3d-assets' AND parent_id IS NULL);

  -- ─────────────────────────────────────────────────────────────
  -- 5. Deactivate old level-1 categories (keep rows for referential integrity)
  -- ─────────────────────────────────────────────────────────────

  UPDATE public.categories
  SET is_active = false
  WHERE slug IN (
    'stock-video', 'video-assets', 'stock-music', 'sound-assets',
    'graphic-assets', 'presentation-assets', 'stock-photos',
    'web-assets', 'cms-assets', 'wordpress-assets', '3d-assets'
  )
  AND parent_id IS NULL;

END $$;
