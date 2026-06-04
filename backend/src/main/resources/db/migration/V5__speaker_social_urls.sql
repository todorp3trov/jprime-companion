alter table speaker add column if not exists social_url varchar(256) not null default '';

update speaker
set social_url = case
    when handle = '@kevindubois.com' then 'https://bsky.app/profile/kevindubois.com'
    when handle <> '' then 'https://x.com/' || regexp_replace(handle, '^@', '')
    else ''
end
where social_url = '';
