-- Sample notifications layered on top of the generated conference data.

insert into notification (id, kind, title, body, time_label, unread, sort_order) values
  ('n-venkat-move', 'alert', 'Room change',
   'Day 2 update: Know Your Java? with Venkat Subramaniam has moved from Hall B to Hall A.',
   'now', true, 0);
