-- Remove the misassigned girl image from every record that used it.
update public.artists
set
  profile_image_url = null,
  updated_at = now()
where slug = 'meera-rao';

update public.events
set
  banner_url = null,
  thumbnail_url = null,
  updated_at = now()
where slug = 'rajesh-kumar-unfiltered';
