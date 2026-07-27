-- Remove the generated artist imagery from Rajesh Kumar's public profile.
update public.artists
set
  profile_image_url = null,
  cover_image_url = null,
  updated_at = now()
where slug = 'rajesh-kumar';
