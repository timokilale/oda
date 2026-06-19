=>SSE does not work. I opened management->orders in one tab, and made an order, from another tab via the table as a customer, the order does not reflect in management->orders until refreshed. 
=>Management->reports shows 5 orders, but "MariaDB [oda_cloud]> select * from orders;
+----+---------------+--------------+-----------+---------------------+
| id | restaurant_id | table_number | status    | created_at          |
+----+---------------+--------------+-----------+---------------------+
|  1 | restaurant-1  | erer         | completed | 2026-06-17 11:38:44 |
|  2 | restaurant-1  | erer         | completed | 2026-06-17 12:13:18 |
|  3 | restaurant-1  | erer         | completed | 2026-06-17 12:14:17 |
|  4 | restaurant-1  | dffd         | completed | 2026-06-17 12:19:12 |
|  5 | restaurant-1  | dffd         | completed | 2026-06-17 12:22:32 |
|  6 | restaurant-1  | qqqqqqqqq    | completed | 2026-06-17 12:43:43 |
|  7 | restaurant-1  | qqqqqqqqq    | completed | 2026-06-18 16:15:37 |
|  8 | restaurant-1  | 1            | completed | 2026-06-18 16:17:41 |
|  9 | restaurant-1  | 22           | completed | 2026-06-18 16:18:00 |
| 10 | restaurant-1  | 394          | completed | 2026-06-18 16:19:11 |
| 11 | restaurant-1  | 22           | pending   | 2026-06-18 16:21:56 |
+----+---------------+--------------+-----------+---------------------+
11 rows in set (0.000 sec)

MariaDB [oda_cloud]> select count(*) from orders;
+----------+
| count(*) |
+----------+
|       11 |
+----------+
1 row in set (0.000 sec)

MariaDB [oda_cloud]>"... where does it take the data?